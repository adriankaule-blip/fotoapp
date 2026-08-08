'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { captionFor, modeList, styleList } from '../../lib/styles'

const STYLES = styleList()
const MODES = modeList()
const EXPECTED_SECONDS = 30
const CONCURRENCY = 2

type JobStatus = 'ready' | 'running' | 'done' | 'error'

type Job = {
  id: string
  file: File
  name: string
  previewUrl: string
  status: JobStatus
  startedAt?: number
  result?: { improved: string; storyCard: string; feedCard: string; sideBySide: string }
  error?: string
}

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

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^\wæøåÆØÅ-]+/g, '-') || 'foto'
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

type HistoryJob = { id: string; mode: string; style: string; caption: string; createdAt: string; files: string[] }
type User = { email: string; name: string }

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [mode, setMode] = useState<string>('renovering')
  const [style, setStyle] = useState<string>('klassisk')
  const [caption, setCaption] = useState('')
  const [captionTouched, setCaptionTouched] = useState(false)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryJob[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const jobsRef = useRef<Job[]>([])
  jobsRef.current = jobs

  useEffect(() => {
    if (!captionTouched) setCaption(captionFor(mode, style))
  }, [mode, style, captionTouched])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      if (!res.ok) return
      const data = await res.json()
      setHistory(data.jobs || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user || null)
        setAuthChecked(true)
        if (data.user) loadHistory()
      })
      .catch(() => setAuthChecked(true))
  }, [loadHistory])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    if (loginBusy) return
    setLoginBusy(true)
    setLoginError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, code: loginCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Fejl (${res.status})`)
      setUser({ email: data.email, name: data.name })
      loadHistory()
    } catch (err: any) {
      setLoginError(err.message || 'Kunne ikke logge ind')
    } finally {
      setLoginBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    setHistory([])
  }

  useEffect(() => {
    if (!busy) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [busy])

  const pick = useCallback((files: FileList | File[] | null | undefined) => {
    if (!files) return
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!images.length) return
    setJobs(prev => [
      ...prev,
      ...images.map(f => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        name: f.name,
        previewUrl: URL.createObjectURL(f),
        status: 'ready' as JobStatus,
      })),
    ])
  }, [])

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs(js => js.map(j => (j.id === id ? { ...j, ...patch } : j)))
  }

  function removeJob(id: string) {
    setJobs(js => {
      const j = js.find(x => x.id === id)
      if (j) URL.revokeObjectURL(j.previewUrl)
      return js.filter(x => x.id !== id)
    })
  }

  async function runOne(id: string, opts: { mode: string; style: string; caption: string }) {
    const job = jobsRef.current.find(j => j.id === id)
    if (!job) return
    updateJob(id, { status: 'running', error: undefined, result: undefined, startedAt: Date.now() })
    try {
      const small = await downscale(job.file)
      const form = new FormData()
      form.append('image', small, 'photo.jpg')
      form.append('mode', opts.mode)
      form.append('style', opts.style)
      form.append('caption', opts.caption)
      const res = await fetch('/api/improve', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setUser(null)
        throw new Error('Din session er udløbet — log ind igen')
      }
      if (!res.ok) throw new Error(data.error || `Fejl (${res.status})`)
      updateJob(id, {
        status: 'done',
        result: { improved: data.improved, storyCard: data.storyCard, feedCard: data.feedCard, sideBySide: data.sideBySide },
      })
    } catch (err: any) {
      updateJob(id, { status: 'error', error: err.message || 'Noget gik galt' })
    }
  }

  async function runJobs(ids: string[]) {
    if (busy || !ids.length) return
    setBusy(true)
    const opts = { mode, style, caption }
    const queue = [...ids]
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const id = queue.shift()
        if (!id) break
        await runOne(id, opts)
      }
    })
    await Promise.all(workers)
    setBusy(false)
    loadHistory()
  }

  function generate() {
    runJobs(jobs.filter(j => j.status === 'ready' || j.status === 'error').map(j => j.id))
  }

  const doneJobs = jobs.filter(j => j.status === 'done')
  const pendingCount = jobs.filter(j => j.status === 'ready' || j.status === 'error').length
  const runningCount = jobs.filter(j => j.status === 'running').length
  const totalActive = busy ? jobs.filter(j => j.status !== 'ready').length : 0

  function downloadAll() {
    doneJobs.forEach((j, i) => {
      setTimeout(() => triggerDownload(j.result!.storyCard, `${baseName(j.name)}-story.jpg`), i * 400)
    })
  }

  function jobPct(j: Job): number {
    if (!j.startedAt) return 0
    return Math.min(95, Math.round(((now - j.startedAt) / 1000 / EXPECTED_SECONDS) * 100))
  }

  if (!authChecked) {
    return (
      <div className="wrap">
        <header className="site"><h1>fotoapp</h1></header>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="wrap">
        <header className="site">
          <h1><a href="/" className="home-link">fotoapp</a></h1>
          <p>Log ind for at forbedre dine boligfotos.</p>
        </header>
        <form className="login-card" onSubmit={login}>
          <div className="section-label">E-mail</div>
          <input
            className="text"
            type="email"
            autoComplete="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
          />
          <div className="section-label">Kode</div>
          <input
            className="pass"
            type="password"
            autoComplete="current-password"
            value={loginCode}
            onChange={e => setLoginCode(e.target.value)}
          />
          <button className="go" disabled={!loginEmail || !loginCode || loginBusy} type="submit">
            {loginBusy ? 'Logger ind…' : 'Log ind'}
          </button>
          {loginError && <div className="error">{loginError}</div>}
        </form>
        <footer className="site">Har du ikke en kode? Kontakt Adrian.</footer>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="site">
        <h1><a href="/" className="home-link">fotoapp</a></h1>
        <p>Træk ét eller flere boligfotos ind, vælg hvad der skal ske — få AI-forbedrede før/efter-kort.</p>
        <p className="whoami">{user.name} · <button className="linkish" type="button" onClick={logout}>Log ud</button></p>
      </header>

      <div
        className={`dropzone ${drag ? 'drag' : ''} ${jobs.length ? 'has-files' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }}
      >
        {jobs.length ? (
          <>
            <div className="thumbs" onClick={e => e.stopPropagation()}>
              {jobs.map(j => (
                <div key={j.id} className={`thumb ${j.status}`}>
                  <img src={j.previewUrl} alt={j.name} />
                  {j.status === 'running' && (
                    <div className="thumb-progress"><div style={{ width: `${jobPct(j)}%` }} /></div>
                  )}
                  {j.status === 'done' && <span className="badge ok">✓</span>}
                  {j.status === 'error' && <span className="badge err">!</span>}
                  {!busy && (
                    <button className="rm" type="button" title="Fjern" onClick={() => removeJob(j.id)}>✕</button>
                  )}
                </div>
              ))}
              {!busy && (
                <button className="thumb add" type="button" onClick={() => inputRef.current?.click()}>+</button>
              )}
            </div>
            <p className="queue-note">
              {jobs.length} {jobs.length === 1 ? 'billede' : 'billeder'} — træk flere hertil eller klik +
            </p>
          </>
        ) : (
          <>
            <div className="big">📷</div>
            <p><strong>Træk billeder hertil</strong> eller klik for at vælge — gerne mange ad gangen</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => { pick(e.target.files); e.target.value = '' }}
        />
      </div>

      <div className="section-label">Hvad skal der ske?</div>
      <div className="modes">
        {MODES.map(m => (
          <button
            key={m.key}
            className={`style-chip ${mode === m.key ? 'active' : ''}`}
            onClick={() => setMode(m.key)}
            type="button"
          >
            <div className="name">{m.emoji} {m.name}</div>
            <div className="desc">{m.description}</div>
          </button>
        ))}
      </div>

      {MODES.find(m => m.key === mode)?.usesStyle && (
        <>
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
        </>
      )}

      <div className="section-label">Billedtekst på kortene</div>
      <input
        className="text"
        value={caption}
        maxLength={80}
        onChange={e => { setCaption(e.target.value); setCaptionTouched(true) }}
      />

      <button className="go" disabled={!pendingCount || busy} onClick={generate} type="button">
        {busy
          ? `Genererer… (${doneJobs.length + jobs.filter(j => j.status === 'error').length}/${totalActive} færdige)`
          : pendingCount > 1
            ? `Forbedr ${pendingCount} billeder ✨`
            : 'Forbedr billedet ✨'}
      </button>

      {busy && (
        <div className="progress">
          <div className="bar">
            <div style={{ width: `${totalActive ? Math.round(((totalActive - runningCount - pendingCount + 0.5 * runningCount) / totalActive) * 100) : 0}%` }} />
          </div>
          <p>AI'en renoverer {runningCount > 1 ? `${runningCount} billeder ad gangen` : 'dit billede'} — ca. ½ minut pr. billede</p>
        </div>
      )}

      {doneJobs.length > 0 && (
        <div className="result">
          <div className="result-head">
            <div className="section-label">{doneJobs.length === 1 ? 'Dit før/efter-kort' : `${doneJobs.length} før/efter-kort`}</div>
            {doneJobs.length > 1 && (
              <button className="download-all" type="button" onClick={downloadAll}>Hent alle kort ⬇</button>
            )}
          </div>
          {jobs.filter(j => j.status === 'done' || j.status === 'error').map(j =>
            j.status === 'error' ? (
              <div key={j.id} className="result-item">
                <div className="error">
                  {j.name}: {j.error}
                  <button className="regen" type="button" disabled={busy} onClick={() => runJobs([j.id])}>Prøv igen</button>
                </div>
              </div>
            ) : (
              <div key={j.id} className="result-item">
                <img src={j.result!.storyCard} alt={`Før/efter-kort — ${j.name}`} className="card" />
                <div className="actions formats">
                  <a className="primary" href={j.result!.storyCard} download={`${baseName(j.name)}-story.jpg`}>Story 9:16</a>
                  <a href={j.result!.feedCard} download={`${baseName(j.name)}-feed.jpg`}>Feed 4:5</a>
                  <a href={j.result!.sideBySide} download={`${baseName(j.name)}-side.jpg`}>Side om side</a>
                  <a href={j.result!.improved} download={`${baseName(j.name)}-efter.jpg`}>Kun efter</a>
                  <button type="button" disabled={busy} onClick={() => runJobs([j.id])}>Generér igen ↻</button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="history">
          <div className="section-label">Tidligere genereringer</div>
          <div className="history-grid">
            {history.map(h => (
              <a key={h.id} className="history-item" href={`/api/file/${h.id}/story.jpg`} target="_blank" rel="noreferrer">
                <img src={`/api/file/${h.id}/story.jpg`} alt={h.caption} loading="lazy" />
                <span>{h.caption}</span>
                <time>{new Date(h.createdAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</time>
              </a>
            ))}
          </div>
        </div>
      )}

      <footer className="site">
        Dine billeder gemmes i dit private arkiv, så du kan finde dem igen. Alle AI-billeder mærkes »EFTER — AI«.
      </footer>
    </div>
  )
}
