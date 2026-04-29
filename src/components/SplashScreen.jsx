import { useEffect, useState } from 'react'
import DenariLogo from './DenariLogo'
import { playSound } from '../utils/audio'
import { useTranslation } from 'react-i18next'

export default function SplashScreen({ onFinish }) {
  const { t } = useTranslation()
  const [fadeOut, setFadeOut] = useState(false)

  const savedTheme = localStorage.getItem('scopa-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  let bgColor = '#1a1a2e'
  const textColor = '#f5f0e8'
  if (savedTheme === 'green') bgColor = '#1a3a2a'
  else if (!savedTheme && !prefersDark) bgColor = '#1a3a2a'
  const subtitleColor = bgColor === '#1a1a2e' ? '#5a5440' : '#6b8a78'

  useEffect(() => {
    playSound('apertura')
    const timer1 = setTimeout(() => setFadeOut(true), 1800)
    const timer2 = setTimeout(() => onFinish(), 2300)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: bgColor,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px', zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>

      <div style={{
        width: '140px', height: '140px',
        filter: 'drop-shadow(0 0 30px rgba(201,150,58,0.45))',
        animation: 'scopaScaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        <DenariLogo size={140} glow={true} />
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '30px', fontWeight: '600',
        letterSpacing: '0.12em',
        color: textColor,
        textTransform: 'uppercase',
        animation: 'scopaSlideUp 0.6s 0.25s ease both',
      }}>
        Scopa<span style={{ color: 'var(--gold)' }}>Score</span>
      </div>

      <div style={{
        fontSize: '12px',
        letterSpacing: '0.25em',
        color: subtitleColor,
        textTransform: 'uppercase',
        animation: 'scopaSlideUp 0.6s 0.4s ease both',
      }}>
        {t('login.sottotitolo')}
      </div>

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