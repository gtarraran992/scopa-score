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
import { Preferences } from '@capacitor/preferences'
import { initAudio, playSound } from './utils/audio'
import { PushNotifications } from '@capacitor/push-notifications'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import SplashScreen from './components/SplashScreen'
import DenariLogo from './components/DenariLogo'
import { App as CapacitorApp } from '@capacitor/app'
import Consenso from './pages/Consenso'

const isIOS = Capacitor.getPlatform() === 'ios'
const isAndroid = Capacitor.getPlatform() === 'android'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [showSplash, setShowSplash] = useState(true)

  // 1. Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  // 2. Audio + notifiche
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    initAudio()

    // Listener notifica ricevuta — con cleanup per evitare memory leak
    let listenerHandle = null
    LocalNotifications.addListener('localNotificationReceived', () => {
      playSound('notifica')
    }).then(handle => {
      listenerHandle = handle
    })

    // Salva la lingua nelle Preferences per il NotificationReceiver Android (Kotlin)
    if (isAndroid) {
      const lang = (localStorage.getItem('i18nextLng') || 'it').split('-')[0]
      Preferences.set({ key: 'appLang', value: lang })
    }

    // Su iOS gestiamo le notifiche giornaliere via plugin
    // Su Android è gestito nativamente in MainActivity.kt / NotificationReceiver.kt
    if (isIOS) {
      async function scheduleNotificaIOS() {
        const { display } = await LocalNotifications.checkPermissions()
        if (display !== 'granted') {
          const { display: granted } = await LocalNotifications.requestPermissions()
          if (granted !== 'granted') return
        }

        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications.map(n => ({ id: n.id }))
          })
        }

        const now = new Date()
        const next = new Date()
        next.setHours(12, 0, 0, 0)
        if (now >= next) next.setDate(next.getDate() + 1)

        const lang = (localStorage.getItem('i18nextLng') || 'it').split('-')[0]
        const bodies = {
          it: 'Sfida un amico a Scopa oggi!',
          en: 'Challenge a friend to Scopa today!',
          es: '¡Reta a un amigo a jugar a la Scopa hoy!',
          fr: "Défie un ami à la Scopa aujourd'hui !",
          de: 'Fordere heute einen Freund zur Scopa heraus!',
        }

        await LocalNotifications.schedule({
          notifications: [{
            id: 1,
            title: '🃏 ScopaScore',
            body: bodies[lang] || bodies['it'],
            schedule: {
              at: next,
              repeats: true,
              every: 'day',
            },
            sound: null,
          }]
        })
      }

      scheduleNotificaIOS()
    }

    return () => {
      listenerHandle?.remove()
    }
  }, [])

  // 3. FCM token — dipende da user
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!user?.uid) return

    let registrationHandle = null

    async function registerFCMToken() {
      try {
        const { receive } = await PushNotifications.checkPermissions()
        if (receive !== 'granted') {
          const { receive: granted } = await PushNotifications.requestPermissions()
          if (granted !== 'granted') return
        }
        await PushNotifications.register()
        registrationHandle = await PushNotifications.addListener('registration', async token => {
          await updateDoc(doc(db, 'users', user.uid), { fcmToken: token.value })
        })
      } catch (e) {
        console.warn('FCM registration error:', e)
      }
    }

    registerFCMToken()

    return () => {
      registrationHandle?.remove()
    }
  }, [user?.uid])

  // 4. Back button — solo Android (iOS gestisce il back natively)
  useEffect(() => {
    if (!isAndroid) return
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapacitorApp.exitApp()
      }
    })
    return () => listener.then(l => l.remove())
  }, [])

  if (user === undefined) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <DenariLogo size={80} glow={true} />
    </div>
  )

  const isGuest = !user

  return (
    <div style={{ height: '100%' }}>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/consenso" element={<Consenso />} />
        <Route path="/" element={
          !localStorage.getItem('consenso-accettato')
            ? <Navigate to="/consenso" />
            : localStorage.getItem('onboarding-done')
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