import { useEffect, useRef, useState, useCallback } from 'react'

const W = 600
const H = 780

// Filter presets for polaroid images
const FILTER_PRESETS = {
  none:  [],
  noir:  (f) => [new f.Image.filters.Grayscale()],
  warm:  (f) => [new f.Image.filters.Sepia({ sepia: 0.4 }), new f.Image.filters.Brightness({ brightness: 0.05 })],
  fade:  (f) => [new f.Image.filters.Brightness({ brightness: 0.12 }), new f.Image.filters.Contrast({ contrast: -0.15 }), new f.Image.filters.Saturation({ saturation: -0.35 })],
  vivid: (f) => [new f.Image.filters.Saturation({ saturation: 0.45 }), new f.Image.filters.Contrast({ contrast: 0.1 })],
}

export const FILTER_NAMES = Object.keys(FILTER_PRESETS)

export function useCanvas(canvasRef) {
  const fabric = useRef(null)
  const canvas = useRef(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!canvasRef.current) return
    let cv

    ;(async () => {
      const mod = await import('fabric')
      fabric.current = mod.fabric

      cv = new mod.fabric.Canvas(canvasRef.current, {
        width: W,
        height: H,
        backgroundColor: '#f5f0e8',
        preserveObjectStacking: true,
      })
      canvas.current = cv

      cv.on('selection:created', e => setSelected(e.selected?.[0] ?? null))
      cv.on('selection:updated', e => setSelected(e.selected?.[0] ?? null))
      cv.on('selection:cleared', () => setSelected(null))

      setReady(true)
    })()

    return () => { cv?.dispose() }
  }, [])

  // ─── Background ─────────────────────────────────────────────────────────────

  const setBackground = useCallback((bg) => {
    const f = fabric.current
    const cv = canvas.current
    if (!f || !cv) return

    if (bg.solid) {
      cv.setBackgroundColor(bg.solid, cv.renderAll.bind(cv))
      return
    }

    const img = new Image()
    img.onload = () => {
      const pattern = new f.Pattern({ source: img, repeat: 'repeat' })
      cv.setBackgroundColor(pattern, cv.renderAll.bind(cv))
    }
    img.src = bg.patternUrl
  }, [])

  // ─── Note ────────────────────────────────────────────────────────────────────
  // Uses interactive group (fabric v5.2+) so IText remains editable inside group

  const addNote = useCallback(() => {
    const f = fabric.current
    const cv = canvas.current
    if (!f || !cv) return

    const W_NOTE = 230
    const H_NOTE = 270
    const PAD = 14
    const LINE_GAP = 26

    const paper = new f.Rect({
      width: W_NOTE, height: H_NOTE,
      fill: '#faf7f0',
      strokeWidth: 0,
      shadow: new f.Shadow({ color: 'rgba(0,0,0,0.14)', blur: 18, offsetX: 2, offsetY: 5 }),
    })

    // Ruled lines
    const lines = []
    for (let y = 52; y < H_NOTE - PAD; y += LINE_GAP) {
      lines.push(new f.Line([PAD, y, W_NOTE - PAD, y], {
        stroke: '#d8cdb8', strokeWidth: 0.7,
        selectable: false, evented: false,
      }))
    }

    // Red margin line
    const margin = new f.Line([44, PAD, 44, H_NOTE - PAD], {
      stroke: '#e8a0a0', strokeWidth: 0.8,
      selectable: false, evented: false,
    })

    const text = new f.IText('write something…', {
      left: 52, top: 18,
      width: W_NOTE - 64,
      fontFamily: 'Dancing Script, cursive',
      fontSize: 17,
      fill: '#2a1f14',
      lineHeight: 1.52,
      editingBorderColor: 'transparent',
    })

    const group = new f.Group([paper, ...lines, margin, text], {
      left: W / 2 - W_NOTE / 2,
      top: H / 2 - H_NOTE / 2,
      angle: -1.5,
      interactive: true,
      subTargetCheck: true,
      data: { type: 'note' },
    })

    cv.add(group)
    cv.setActiveObject(group)
    cv.renderAll()
  }, [])

  // ─── Polaroid ────────────────────────────────────────────────────────────────

  const addPolaroid = useCallback((dataUrl) => {
    const f = fabric.current
    const cv = canvas.current
    if (!f || !cv) return

    f.Image.fromURL(dataUrl, (img) => {
      const MAX = 190
      const scale = MAX / Math.max(img.width, img.height)
      img.scale(scale)

      const iW = img.getScaledWidth()
      const iH = img.getScaledHeight()
      const BORDER = 10
      const FOOT = 40

      const frame = new f.Rect({
        width: iW + BORDER * 2,
        height: iH + BORDER + FOOT,
        fill: '#fffef9',
        shadow: new f.Shadow({ color: 'rgba(0,0,0,0.22)', blur: 20, offsetX: 3, offsetY: 7 }),
      })

      img.set({ left: BORDER, top: BORDER, selectable: false })

      const caption = new f.IText('caption', {
        left: BORDER, top: iH + BORDER + 8,
        width: iW,
        fontFamily: 'Dancing Script, cursive',
        fontSize: 13,
        fill: '#666',
        textAlign: 'center',
        selectable: false,
      })

      const group = new f.Group([frame, img, caption], {
        left: W / 2 - (iW + BORDER * 2) / 2,
        top: H / 2 - (iH + BORDER + FOOT) / 2,
        angle: 2,
        interactive: true,
        subTargetCheck: true,
        data: { type: 'polaroid', filterName: 'none' },
      })

      cv.add(group)
      cv.setActiveObject(group)
      cv.renderAll()
    }, { crossOrigin: 'anonymous' })
  }, [])

  // ─── Apply filter to selected polaroid ──────────────────────────────────────

  const applyFilter = useCallback((filterName) => {
    const f = fabric.current
    const cv = canvas.current
    if (!f || !cv) return

    const obj = cv.getActiveObject()
    if (!obj || obj.data?.type !== 'polaroid') return

    // Find the image within the group
    const img = obj.getObjects().find(o => o.type === 'image')
    if (!img) return

    img.filters = filterName === 'none' ? [] : FILTER_PRESETS[filterName](f)
    img.applyFilters()
    obj.data.filterName = filterName
    cv.renderAll()
  }, [])

  // ─── Object (with optional BG removal) ──────────────────────────────────────

  const addObject = useCallback(async (dataUrl, removeBg = false) => {
    const f = fabric.current
    const cv = canvas.current
    if (!f || !cv) return

    let finalUrl = dataUrl

    if (removeBg) {
      const { removeBackground } = await import('./bgRemoval')
      finalUrl = await removeBackground(dataUrl)
    }

    f.Image.fromURL(finalUrl, (img) => {
      const MAX = 220
      const scale = MAX / Math.max(img.width, img.height)
      img.scale(scale)
      img.set({
        left: W / 2 - img.getScaledWidth() / 2,
        top: H / 2 - img.getScaledHeight() / 2,
        data: { type: 'object' },
      })
      cv.add(img)
      cv.setActiveObject(img)
      cv.renderAll()
    }, { crossOrigin: 'anonymous' })
  }, [])

  // ─── Deletion ────────────────────────────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    const cv = canvas.current
    if (!cv) return
    const obj = cv.getActiveObject()
    if (!obj) return
    cv.remove(obj)
    cv.discardActiveObject()
    cv.renderAll()
  }, [])

  // ─── Export ──────────────────────────────────────────────────────────────────

  const exportJSON = useCallback(() => {
    return canvas.current?.toJSON(['data']) ?? null
  }, [])

  const exportImage = useCallback((multiplier = 2) => {
    return canvas.current?.toDataURL({ format: 'png', multiplier }) ?? null
  }, [])

  const loadFromJSON = useCallback((json) => {
    const cv = canvas.current
    if (!cv || !json) return
    cv.loadFromJSON(json, cv.renderAll.bind(cv))
  }, [])

  return {
    ready, selected,
    setBackground,
    addNote, addPolaroid, addObject,
    applyFilter, deleteSelected,
    exportJSON, exportImage, loadFromJSON,
  }
}
