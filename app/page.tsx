'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Draggable before/after comparison slider. Handle is the only touch-captured
 *  element so the page keeps scrolling normally on mobile. */
function BeforeAfter({
  before,
  after,
  alt,
  initial = 50,
  priority = false,
}: {
  before: string
  after: string
  alt: string
  initial?: number
  priority?: boolean
}) {
  const [pos, setPos] = useState(initial)
  const ref = useRef<HTMLDivElement>(null)

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  function onHandleDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onHandleMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromClientX(e.clientX)
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') setPos(p => Math.max(2, p - 4))
    if (e.key === 'ArrowRight') setPos(p => Math.min(98, p + 4))
  }

  return (
    <div className="ba" ref={ref} onClick={e => setFromClientX(e.clientX)}>
      <img className="ba-img" src={after} alt={`${alt} — efter`} loading={priority ? 'eager' : 'lazy'} />
      <div className="ba-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img className="ba-img" src={before} alt={`${alt} — før`} loading={priority ? 'eager' : 'lazy'} />
      </div>
      <span className="ba-label l">FØR</span>
      <span className="ba-label r">EFTER — AI</span>
      <div className="ba-line" style={{ left: `${pos}%` }} aria-hidden="true" />
      <button
        className="ba-handle"
        style={{ left: `${pos}%` }}
        type="button"
        role="slider"
        aria-label={`Før/efter-skyder — ${alt}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onKeyDown={onKey}
        onClick={e => e.stopPropagation()}
      >
        ⟷
      </button>
    </div>
  )
}

const STEPS = [
  { n: '1', title: 'Upload dine fotos', text: 'Træk ét eller mange boligfotos ind — direkte fra telefonen eller kameraet.' },
  { n: '2', title: 'Vælg hvad der skal ske', text: 'Fuld renovering, møblering af tomme rum eller bare professionel oprydning — i seks stilarter.' },
  { n: '3', title: 'Hent dine kort', text: 'Før/efter-kort til story og feed, side-om-side til boligannoncen — klar på et halvt minut.' },
]

const MODES = [
  { emoji: '🛠️', title: 'Renovering', text: 'Vis boligens potentiale: nye gulve, friske vægge og møbler i den valgte stil — arkitekturen bevares præcist.' },
  { emoji: '🛋️', title: 'Møblering', text: 'Tomme rum møbleres indbydende. Vægge, gulve og overflader røres ikke — kun møbler og styling tilføjes.' },
  { emoji: '🧹', title: 'Oprydning', text: 'Samme bolig, samme møbler — bare ryddet op, rengjort og klar til fremvisning.' },
]

const GALLERY = [
  { key: 'gaard', caption: 'Gårdhaven — hvidmalet og indbydende' },
  { key: 'spisestue', caption: 'Ny spisestue med egetræsgulv' },
  { key: 'loft', caption: 'Råt loft → færdig førstesal med loft til kip' },
]

export default function Landing() {
  const revealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = revealRef.current?.querySelectorAll('.reveal')
    if (!els?.length) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.15 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing" ref={revealRef}>
      <nav className="lnav">
        <span className="brand">fotoapp</span>
        <a className="lnav-cta" href="/app">Åbn appen</a>
      </nav>

      <header className="lhero">
        <BeforeAfter before="/samples/hero-before.jpg" after="/samples/hero-after.jpg" alt="Husets facade" initial={38} priority />
        <div className="lhero-copy">
          <h1>Se boligens potentiale, før hammeren rammer.</h1>
          <p>AI-visualiseret renovering af rigtige boligfotos — som før/efter-kort, klar til fremvisning og sociale medier.</p>
          <a className="cta" href="/app">Prøv med dit eget foto →</a>
          <span className="fine">Træk i skyderen for at se forskellen</span>
        </div>
      </header>

      <section className="lsec reveal">
        <h2>Sådan virker det</h2>
        <div className="steps">
          {STEPS.map(s => (
            <div key={s.n} className="step">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lsec alt reveal">
        <h2>Tre måder at løfte et foto</h2>
        <div className="mode-cards">
          {MODES.map(m => (
            <div key={m.title} className="mode-card">
              <span className="mode-emoji">{m.emoji}</span>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lsec reveal">
        <h2>Ægte boliger, ægte forvandlinger</h2>
        <p className="lsec-sub">Alle billeder er skabt med fotoapp — samme kameravinkel, samme rum, ny fortælling.</p>
        <div className="gallery">
          {GALLERY.map(g => (
            <figure key={g.key}>
              <BeforeAfter before={`/samples/${g.key}-before.jpg`} after={`/samples/${g.key}-after.jpg`} alt={g.caption} initial={42} />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="lsec cta-sec reveal">
        <h2>Klar på et halvt minut</h2>
        <p className="lsec-sub">Upload et foto og få fire færdige formater tilbage: story 9:16, feed 4:5, side-om-side og efter-billedet alene.</p>
        <a className="cta" href="/app">Åbn fotoapp →</a>
      </section>

      <footer className="lfoot">
        <span className="brand">fotoapp</span>
        <p>Alle AI-bearbejdede billeder mærkes tydeligt »EFTER — AI«. Visualiseringer er inspiration — ikke dokumentation af boligens stand.</p>
      </footer>
    </div>
  )
}
