import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Login from './pages/Login'
import Home from './pages/Home'
import NuovaPartita from './pages/NuovaPartita'
import Partita from './pages/Partita'
import Amici from './pages/Amici'
import Profilo from './pages/Profilo'
import Classifica from './pages/Classifica'
import Legal from './pages/Legal'
import Onboarding from './pages/Onboarding'
import OfflineBanner from './components/OfflineBanner'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  useEffect(() => {
  if (!Capacitor.isNativePlatform()) return

  async function scheduleNotifica() {
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') {
      const { display: granted } = await LocalNotifications.requestPermissions()
      if (granted !== 'granted') return
    }

    // Cancella eventuali notifiche precedenti per evitare duplicati
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '🃏 ScopaScore',
          body: 'Sfida un amico a Scopa oggi!',
          schedule: {
            every: 'day',
            on: { hour: 12, minute: 0 },
          },
          sound: null,
          smallIcon: 'ic_launcher',
        }
      ]
    })
  }

  scheduleNotifica()
}, [])

  if (user === undefined) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '24px' }}>♠</span>
    </div>
  )

  const isGuest = !user

  return (
    <div style={{ height: '100%' }}>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={
          localStorage.getItem('onboarding-done')
            ? <Home user={user} isGuest={isGuest} />
            : <Navigate to="/onboarding" />
        } />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/nuova-partita" element={<NuovaPartita user={user} isGuest={isGuest} />} />
        <Route path="/partita/:id" element={<Partita user={user} isGuest={isGuest} />} />
        <Route path="/amici" element={user ? <Amici user={user} /> : <Navigate to="/login" />} />
        <Route path="/profilo" element={user ? <Profilo user={user} /> : <Navigate to="/login" />} />
        <Route path="/classifica" element={user ? <Classifica user={user} /> : <Navigate to="/login" />} />
        <Route path="/privacy" element={<Legal page="privacy" />} />
        <Route path="/termini" element={<Legal page="termini" />} />
      </Routes>
    </div>
  )
}