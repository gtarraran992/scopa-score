import { useNavigate } from 'react-router-dom'
import DenariLogo from '../components/DenariLogo'
import { useTranslation } from 'react-i18next'

export default function Consenso() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  function accetta() {
    localStorage.setItem('consenso-accettato', 'true')
    navigate('/onboarding')
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '60px 32px calc(40px + var(--safe-bottom))',
      background: 'var(--ink)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <DenariLogo size={80} glow={true} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--cream)', textAlign: 'center' }}>
          {t('consenso.titolo')}
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', width: '100%' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
          {t('consenso.desc')}
        </p>
        <div className="card" style={{ padding: '8px 0' }}>
          <button onClick={() => navigate('/termini')} style={{
            width: '100%', padding: '16px 18px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--ink-muted)', cursor: 'pointer'
          }}>
            <span style={{ fontSize: '15px', color: 'var(--gold)' }}>{t('consenso.termini')}</span>
            <span style={{ color: 'var(--text-faint)' }}>→</span>
          </button>
          <button onClick={() => navigate('/privacy')} style={{
            width: '100%', padding: '16px 18px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer'
          }}>
            <span style={{ fontSize: '15px', color: 'var(--gold)' }}>{t('consenso.privacy')}</span>
            <span style={{ color: 'var(--text-faint)' }}>→</span>
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          {t('consenso.nota')}
        </p>
      </div>

      <div style={{ width: '100%' }}>
        <button className="btn-gold" onClick={accetta}>
          {t('consenso.accetta')}
        </button>
      </div>
    </div>
  )
}