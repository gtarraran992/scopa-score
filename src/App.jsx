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

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  if (user === undefined) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '24px' }}>♠</span>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={
        user
        ? localStorage.getItem('onboarding-done')
          ? <Home user={user} />
          : <Navigate to="/onboarding" />
          : <Navigate to="/login" />
      } />
      <Route path="/onboarding" element={
        user
        ? <Onboarding />
        : <Navigate to="/login" />
      } />
      <Route path="/nuova-partita" element={user ? <NuovaPartita user={user} /> : <Navigate to="/login" />} />
      <Route path="/partita/:id" element={user ? <Partita user={user} /> : <Navigate to="/login" />} />
      <Route path="/amici" element={user ? <Amici user={user} /> : <Navigate to="/login" />} />
      <Route path="/profilo" element={user ? <Profilo user={user} /> : <Navigate to="/login" />} />
      <Route path="/classifica" element={user ? <Classifica user={user} /> : <Navigate to="/login" />} />
      <Route path="/privacy" element={<Legal page="privacy" />} />
      <Route path="/termini" element={<Legal page="termini" />} />
    </Routes>
  )
}