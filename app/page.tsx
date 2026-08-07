'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { styleList } from '../lib/styles'

const STYLES = styleList()
const EXPECTED_SECONDS = 30

/** Downscale in the browser so uploads stay small (max 2048px JPEG). */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  return new Promise(resolve => canvas.toBlob(b => resolve(b || file), 'image/jpeg', 0.92))
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<string>('klassisk')
  const [caption, setCaption] = useState('')
  const [captionTouched, setCaptionTouched] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ improved: string; storyCard: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!captionTouched) {
      const s = STYLES.find(s => s.key === style)
      if (s) setCaption(s.caption)
    }
  }, [style, captionTouched])

  useEffect(() => {
    if (!busy) return
    setElapsed(0)
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  const pick = useCallback((f: File | undefined | null) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setResult(null)
    setError(null)
    setPreviewUrl(url => {
      if (url) URL.revokeObjectURL(url)
      return URL.createObjectURL(f)
    })
  }, [])

  async function generate() {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const small = await downscale(file)
      const form = new FormData()
      form.append('image', small, 'photo.jpg')
      form.append('style', style)
      form.append('caption', caption)
      form.append('passcode', passcode)
      const res = await fetch('/api/improve', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Fejl (${res.status})`)
      setResult({ improved: data.improved, storyCard: data.storyCard })
    } catch (err: any) {
      setError(err.message || 'Noget gik galt')
    } finally {
      setBusy(false)
    }
  }

  const pct = Math.min(95, Math.round((elapsed / EXPECTED_SECONDS) * 100))

  return (
    <div className="wrap">
      <header className="site">
        <h1>fotoapp</h1>
        <p>Træk et boligfoto ind, vælg en stil — få en AI-renoveret version som før/efter-kort. Intet gemmes.</p>
      </header>

      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Dit foto" className="preview" />
        ) : (
          <>
            <div className="big">📷</div>
            <p><strong>Træk et billede hertil</strong> eller klik for at vælge</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => pick(e.target.files?.[0])}
        />
      </div>

      <div className="section-label">Vælg stil</div>
      <div className="styles">
        {STYLES.map(s => (
          <button
            key={s.key}
            className={`style-chip ${style === s.key ? 'active' : ''}`}
            onClick={() => setStyle(s.key)}
            type="button"
          >
            <div className="name">{s.emoji} {s.name}</div>
            <div className="desc">{s.description}</div>
          </button>
        ))}
      </div>

      <div className="section-label">Billedtekst på kortet</div>
      <input
        className="text"
        value={caption}
        maxLength={80}
        onChange={e => { setCaption(e.target.value); setCaptionTouched(true) }}
      />

      <div className="section-label">Adgangskode</div>
      <input
        className="pass"
        type="password"
        value={passcode}
        placeholder="Adgangskode"
        onChange={e => setPasscode(e.target.value)}
      />

      <button className="go" disabled={!file || busy || !passcode} onClick={generate} type="button">
        {busy ? 'Genererer…' : 'Forbedr billedet ✨'}
      </button>

      {error && <div className="error">{error}</div>}

      {busy && (
        <div className="progress">
          <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          <p>AI'en renoverer dit billede — tager ca. ½ minut ({elapsed}s)</p>
        </div>
      )}

      {result && (
        <div className="result">
          <div className="section-label">Dit før/efter-kort</div>
          <img src={result.storyCard} alt="Før/efter-kort" className="card" />
          <div className="actions">
            <a className="primary" href={result.storyCard} download="fotoapp-story.jpg">Hent kortet</a>
            <a href={result.improved} download="fotoapp-improved.jpg">Hent kun efter-billedet</a>
          </div>
        </div>
      )}

      <footer className="site">
        Billeder behandles kun i din session og gemmes aldrig på serveren.
      </footer>
    </div>
  )
}
