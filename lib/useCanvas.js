import { useEffect, useRef, useState, useCallback } from 'react'

export const FILTER_NAMES = ['none', 'noir', 'warm', 'fade', 'vivid']

function buildFilters(f, name) {
  switch (name) {
    case 'noir':  return [new f.filters.Grayscale()]
    case 'warm':  return [new f.filters.Sepia(), new f.filters.Brightness({ brightness: 0.05 })]
    case 'fade':  return [new f.filters.Brightness({ brightness: 0.1 }), new f.filters.Contrast({ contrast: -0.15 }), new f.filters.Saturation({ saturation: -0.4 })]
    case 'vivid': return [new f.filters.Saturation({ saturation: 0.5 }), new f.filters.Contrast({ contrast: 0.1 })]
    default:      return []
  }
}

export function useCanvas(canvasRef, width, height) {
  const F  = useRef(null)
  const cv = useRef(null)
  const [ready,    setReady]    = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!canvasRef.current) return
    let cancelled = false

    ;(async () => {
      try {
        const mod = await import('fabric')
        F.current = mod.fabric ?? mod

        if (canvasRef.current.__fabric) {
          await cv.current?.dispose()
          cv.current = null
        }

        if (cancelled) return

        const instance = new F.current.Canvas(canvasRef.current, {
          width, height,
          backgroundColor: '#f5f0e8',
          preserveObjectStacking: true,
        })
        cv.current = instance

        instance.on('selection:created', e => setSelected(e.selected?.[0] ?? null))
        instance.on('selection:updated', e => setSelected(e.selected?.[0] ?? null))
        instance.on('selection:cleared', () => setSelected(null))

        if (!cancelled) setReady(true)
      } catch (err) {
        console.error('[useCanvas] init failed:', err)
      }
    })()

    return () => {
      cancelled = true
      cv.current?.dispose()
      cv.current = null
      setReady(false)
    }
  }, [width, height])

  // ─── Background ─────────────────────────────────────────────────────────────

  const setBackground = useCallback((bg) => {
    const f = F.current
    const c = cv.current
    if (!f || !c) return

    if (bg.solid) {
      c.backgroundColor = bg.solid
      c.renderAll()
      return
    }

    const img = new Image()
    img.onload = () => {
      c.backgroundColor = new f.Pattern({ source: img, repeat: 'repeat' })
      c.renderAll()
    }
    img.src = bg.patternUrl
  }, [])

  // ─── Note ────────────────────────────────────────────────────────────────────
  // Build objects at absolute coords, Group auto-recenters children in v5

  const addNote = useCallback(() => {
    const f = F.current
    const c = cv.current
    if (!f || !c) return

    const NW = 230, NH = 270, PAD = 14, GAP = 26

    const paper = new f.Rect({
      left: 0, top: 0,
      width: NW, height: NH,
      fill: '#faf7f0',
      strokeWidth: 0,
      shadow: new f.Shadow({ color: 'rgba(0,0,0,0.14)', blur: 18, offsetX: 2, offsetY: 5 }),
    })

    const ruled = []
    for (let y = 52; y < NH - PAD; y += GAP) {
      ruled.push(new f.Line([PAD, y, NW - PAD, y], {
        stroke: '#d8cdb8', strokeWidth: 0.7,
        selectable: false, evented: false,
      }))
    }

    const margin = new f.Line([44, PAD, 44, NH - PAD], {
      stroke: '#e8a0a0', strokeWidth: 0.8,
      selectable: false, evented: false,
    })

    const text = new f.IText('write something…', {
      left: 52, top: 18,
      width: NW - 64,
      fontFamily: 'Dancing Script, cursive',
      fontSize: 17,
      fill: '#2a1f14',
      lineHeight: 1.52,
      editingBorderColor: 'transparent',
    })

    const group = new f.Group([paper, ...ruled, margin, text], {
      subTargetCheck: true,
      interactive: true,
      angle: -1.5,
      data: { type: 'note' },
    })

    group.set({
      left: width  / 2 - group.width  / 2,
      top:  height / 2 - group.height / 2,
    })

    c.add(group)
    c.setActiveObject(group)
    c.renderAll()
  }, [width, height])

  // ─── Polaroid ────────────────────────────────────────────────────────────────

  const addPolaroid = useCallback(async (dataUrl) => {
    const f = F.current
    const c = cv.current
    if (!f || !c) return

    try {
      const img = await f.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })

      const MAX    = 190
      const scale  = MAX / Math.max(img.width, img.height)
      img.scale(scale)

      const iW     = img.getScaledWidth()
      const iH     = img.getScaledHeight()
      const BORDER = 10
      const FOOT   = 42

      const frame = new f.Rect({
        left: 0, top: 0,
        width: iW + BORDER * 2,
        height: iH + BORDER + FOOT,
        fill: '#fffef9',
        shadow: new f.Shadow({ color: 'rgba(0,0,0,0.22)', blur: 20, offsetX: 3, offsetY: 7 }),
      })

      img.set({ left: BORDER, top: BORDER })

      const caption = new f.IText('caption', {
        left: BORDER,
        top: iH + BORDER + 8,
        width: iW,
        fontFamily: 'Dancing Script, cursive',
        fontSize: 13,
        fill: '#888',
        textAlign: 'center',
      })

      const group = new f.Group([frame, img, caption], {
        subTargetCheck: true,
        interactive: true,
        angle: 2,
        data: { type: 'polaroid', filterName: 'none' },
      })

      group.set({
        left: width  / 2 - group.width  / 2,
        top:  height / 2 - group.height / 2,
      })

      c.add(group)
      c.setActiveObject(group)
      c.renderAll()
    } catch (err) {
      console.error('[addPolaroid]', err)
    }
  }, [width, height])

  // ─── Apply filter ────────────────────────────────────────────────────────────

  const applyFilter = useCallback((filterName) => {
    const f = F.current
    const c = cv.current
    if (!f || !c) return

    const group = c.getActiveObject()
    if (group?.data?.type !== 'polaroid') return

    const img = group.getObjects().find(o => o.type === 'image')
    if (!img) return

    img.filters = buildFilters(f, filterName)
    img.applyFilters()
    group.data.filterName = filterName
    c.renderAll()
  }, [])

  // ─── Object ──────────────────────────────────────────────────────────────────

  const addObject = useCallback(async (dataUrl, removeBg = false) => {
    const f = F.current
    const c = cv.current
    if (!f || !c) return

    try {
      let finalUrl = dataUrl
      if (removeBg) {
        const { removeBackground } = await import('@/lib/bgRemoval')
        finalUrl = await removeBackground(dataUrl)
      }

      const img = await f.FabricImage.fromURL(finalUrl, { crossOrigin: 'anonymous' })
      const MAX = 220
      const scale = MAX / Math.max(img.width, img.height)
      img.scale(scale)
      img.set({
        left: width  / 2 - img.getScaledWidth()  / 2,
        top:  height / 2 - img.getScaledHeight() / 2,
        data: { type: 'object' },
      })
      c.add(img)
      c.setActiveObject(img)
      c.renderAll()
    } catch (err) {
      console.error('[addObject]', err)
    }
  }, [width, height])

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    const c = cv.current
    if (!c) return
    const obj = c.getActiveObject()
    if (!obj) return
    c.remove(obj)
    c.discardActiveObject()
    c.renderAll()
  }, [])

  // ─── Export ──────────────────────────────────────────────────────────────────

  const exportJSON   = useCallback(() => cv.current?.toJSON(['data']) ?? null, [])
  const exportImage  = useCallback((multiplier = 2) => cv.current?.toDataURL({ format: 'png', multiplier }) ?? null, [])
  const loadFromJSON = useCallback((json) => {
    const c = cv.current
    if (!c || !json) return
    c.loadFromJSON(json, c.renderAll.bind(c))
  }, [])

  return {
    ready, selected,
    setBackground,
    addNote, addPolaroid, addObject,
    applyFilter, deleteSelected,
    exportJSON, exportImage, loadFromJSON,
  }
}