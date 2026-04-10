import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 999,
      background: '#3a2a1a',
      borderBottom: '1px solid var(--gold)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '13px', color: '#e8b84b',
      textAlign: 'center', justifyContent: 'center'
    }}>
      📡 Modalità offline — le modifiche verranno sincronizzate al ritorno della connessione
    </div>
  )
}