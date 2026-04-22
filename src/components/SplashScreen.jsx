import { useEffect, useState } from 'react'
import DenariLogo from './DenariLogo'
import { playSound } from '../utils/audio'

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    playSound('apertura')
    const timer1 = setTimeout(() => setFadeOut(true), 1800)
    const timer2 = setTimeout(() => onFinish(), 2300)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f1a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px', zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>

      {/* Denari SVG */}
      <div style={{
        width: '140px', height: '140px',
        filter: 'drop-shadow(0 0 30px rgba(201,150,58,0.45))',
        animation: 'scopaScaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
      <DenariLogo size={140} glow={true} />
      </div>

      {/* Titolo */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '30px', fontWeight: '600',
        letterSpacing: '0.12em',
        color: '#f5f0e8',
        textTransform: 'uppercase',
        animation: 'scopaSlideUp 0.6s 0.25s ease both',
      }}>
        Scopa<span style={{ color: 'var(--gold)' }}>Score</span>
      </div>

      {/* Sottotitolo */}
      <div style={{
        fontSize: '12px',
        letterSpacing: '0.25em',
        color: '#5a5440',
        textTransform: 'uppercase',
        animation: 'scopaSlideUp 0.6s 0.4s ease both',
      }}>
        Il segnapunti italiano
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: '8px', animation: 'scopaSlideUp 0.6s 0.55s ease both' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: 'var(--gold)', opacity: 0.35,
            animation: `scopaDotPulse 1.4s ${delay}s ease-in-out infinite`,
          }}/>
        ))}
      </div>

      <style>{`
        @keyframes scopaScaleIn {
          from { opacity: 0; transform: scale(0.4) rotate(-20deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes scopaSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scopaDotPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}