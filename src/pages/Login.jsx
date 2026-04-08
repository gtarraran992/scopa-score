import { useState } from 'react'
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

async function saveUserToDb(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
      friends: [],
      createdAt: new Date(),
    })
  }
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    try {
      const res = await signInWithPopup(auth, googleProvider)
      await saveUserToDb(res.user)
    } catch (e) {
      setError('Errore con Google. Riprova.')
    }
    setLoading(false)
  }

  async function handleEmail() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          displayName: name,
          email,
          friends: [],
          createdAt: new Date(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError('Email o password errati.')
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Email già registrata.')
      } else if (e.code === 'auth/weak-password') {
        setError('Password troppo corta (min. 6 caratteri).')
      } else {
        setError('Errore. Riprova.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', background: 'var(--ink)'
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--gold)' }}>♠</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--cream)', marginTop: '8px' }}>Scopa</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Il segnapunti per la scopa</p>
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '14px', marginBottom: '20px',
          background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
          borderRadius: 'var(--radius-lg)', color: 'var(--cream)',
          fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continua con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--ink-muted)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>oppure</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--ink-muted)' }} />
        </div>

        {mode === 'register' && (
          <input
            placeholder="Nome visualizzato"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ ...inputStyle, marginBottom: '20px' }}
        />

        {error && (
          <div style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleEmail} disabled={loading} className="btn-gold" style={{ marginBottom: '12px' }}>
          {loading ? '...' : mode === 'login' ? 'Accedi' : 'Registrati'}
        </button>

        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="btn-ghost">
          {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '13px 16px', marginBottom: '12px',
  background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
  borderRadius: 'var(--radius-md)', color: 'var(--cream)', fontSize: '15px',
}