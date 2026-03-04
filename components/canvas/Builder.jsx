'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useCanvas, FILTER_NAMES } from '@/lib/useCanvas'
import { BACKGROUNDS } from '@/lib/backgrounds'
import styles from './Builder.module.css'

const Icon = {
  Note:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
  Photo:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Object: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Trash:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Share:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
}

export default function Builder({ onSave }) {
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const fileInputRef = useRef(null)

  const [dims, setDims] = useState({ w: 0, h: 0 })

  // Fill viewport
  useEffect(() => {
    const measure = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const {
    ready, selected,
    setBackground, addNote, addPolaroid, addObject,
    applyFilter, deleteSelected,
    exportJSON, exportImage,
  } = useCanvas(canvasRef, dims.w, dims.h)

  const [activeBg,      setActiveBg]      = useState(BACKGROUNDS[0])
  const [pendingUpload, setPendingUpload]  = useState(null)
  const [removeBg,      setRemoveBg]      = useState(false)
  const [activeFilter,  setActiveFilter]  = useState('none')
  const [saving,        setSaving]        = useState(false)

  const handleBgSelect = (bg) => {
    setActiveBg(bg)
    setBackground(bg)
  }

  const triggerUpload = (type) => {
    setPendingUpload(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !pendingUpload) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target.result
      if (pendingUpload === 'photo')  addPolaroid(dataUrl)
      if (pendingUpload === 'object') addObject(dataUrl, removeBg)
      setPendingUpload(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [pendingUpload, removeBg, addPolaroid, addObject])

  const handleFilterSelect = (name) => {
    setActiveFilter(name)
    applyFilter(name)
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try { await onSave({ json: exportJSON(), imageUrl: exportImage() }) }
    finally { setSaving(false) }
  }

  const isPolaroid = selected?.data?.type === 'polaroid'

  if (dims.w === 0) return null

  return (
    <div ref={containerRef} className={styles.root}>
      <canvas ref={canvasRef} />

      {/* Background swatches — top left */}
      <div className={styles.bgPicker}>
        {BACKGROUNDS.map(bg => (
          <button
            key={bg.id}
            className={`${styles.swatch} ${activeBg.id === bg.id ? styles.swatchActive : ''}`}
            style={{ background: bg.preview }}
            title={bg.label}
            onClick={() => handleBgSelect(bg)}
          />
        ))}
      </div>

      {/* Filter strip — above toolbar when polaroid selected */}
      {isPolaroid && (
        <div className={styles.filterStrip}>
          {FILTER_NAMES.map(name => (
            <button
              key={name}
              className={`${styles.filterPill} ${activeFilter === name ? styles.filterPillActive : ''}`}
              onClick={() => handleFilterSelect(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Object BG removal toggle — shows when pending object upload */}
      {pendingUpload === 'object' && (
        <div className={styles.objectOpts}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} />
            Remove background
          </label>
        </div>
      )}

      {/* Floating toolbar — bottom center */}
      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={addNote} disabled={!ready}>
          <Icon.Note /><span>Note</span>
        </button>
        <button className={styles.btn} onClick={() => triggerUpload('photo')} disabled={!ready}>
          <Icon.Photo /><span>Photo</span>
        </button>
        <button className={styles.btn} onClick={() => triggerUpload('object')} disabled={!ready}>
          <Icon.Object /><span>Object</span>
        </button>
        <div className={styles.sep} />
        <button className={styles.btn} onClick={deleteSelected} disabled={!selected}>
          <Icon.Trash />
        </button>
        <button className={`${styles.btn} ${styles.shareBtn}`} onClick={handleSave} disabled={!ready || saving}>
          <Icon.Share /><span>{saving ? 'Saving…' : 'Share'}</span>
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className={styles.hidden} onChange={handleFileChange} />
    </div>
  )
}