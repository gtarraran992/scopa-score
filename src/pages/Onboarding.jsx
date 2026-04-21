import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    icon: '♠',
    title: 'Benvenuto in ScopaScore',
    desc: 'Il segnapunti digitale per il gioco di carte Scopa. Tieni traccia dei punti senza più perderti.',
  },
  {
    icon: '🃏',
    title: 'Crea una partita',
    desc: 'Scegli i giocatori, il target di punti e le varianti che usate. Da 2 a 6 giocatori.',
  },
  {
    icon: '✅',
    title: 'Registra ogni mano',
    desc: 'Seleziona chi ha preso carte, denari, sette bello, re bello, primiera e conta scope e napoli.',
  },
  {
    icon: '🏆',
    title: 'Statistiche e classifiche',
    desc: 'Tieni traccia delle tue vittorie e sfida i tuoi amici con le classifiche.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)

function finish() {
  localStorage.setItem('onboarding-done', 'true')
  window.location.href = '/'  // invece di navigate('/')
}

  function next() {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1)
    else finish()
  }

  const s = SLIDES[slide]

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '60px 32px calc(40px + var(--safe-bottom))',
      background: 'var(--ink)'
    }}>
      {/* Skip */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        {slide < SLIDES.length - 1 && (
          <button onClick={finish} style={{
            background: 'none', border: 'none',
            color: 'var(--text-faint)', fontSize: '14px'
          }}>
            Salta
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '28px',
          background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '48px', marginBottom: '32px'
        }}>
          {s.icon}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '26px',
          color: 'var(--cream)', marginBottom: '16px', lineHeight: 1.3
        }}>
          {s.title}
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '300px' }}>
          {s.desc}
        </p>
      </div>

      {/* Bottom */}
      <div style={{ width: '100%' }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? '24px' : '8px', height: '8px',
              borderRadius: '4px',
              background: i === slide ? 'var(--gold)' : 'var(--ink-muted)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        <button className="btn-gold" onClick={next}>
          {slide < SLIDES.length - 1 ? 'Avanti' : 'Inizia →'}
        </button>
      </div>
    </div>
  )
}