import { useState } from 'react'
import { signInWithPopup, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getPartiteLocali, clearPartiteLocali } from '../localDB'
import { auth, googleProvider, db } from '../firebase'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import DenariLogo from '../components/DenariLogo'
import { useTranslation } from 'react-i18next'

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
      photoURL: user.photoURL || null, // ✅ aggiunto
    })
  } else {
    // ✅ aggiorna photoURL solo se l'utente non ha una foto custom su Storage
    const data = snap.data()
    const isStoragePhoto = data.photoURL?.includes('firebasestorage')
    if (!isStoragePhoto && user.photoURL && data.photoURL !== user.photoURL) {
      await updateDoc(ref, { photoURL: user.photoURL })
    }
  }
}

async function migraPartiteLocali(user) {
  const partite = getPartiteLocali()
  if (partite.length === 0) return
  for (const p of partite) {
    await addDoc(collection(db, 'partite'), {
      players: p.players,
      uids: [user.uid],
      target: p.target,
      opzioni: p.opzioni || { rebello: true, napoli: true },
      mani: p.mani || [],
      conclusa: p.conclusa || false,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    })
  }
  clearPartiteLocali()
}

export default function Login() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle()
        const credential = GoogleAuthProvider.credential(result.credential?.idToken)
        const res = await signInWithCredential(auth, credential)
        await saveUserToDb(res.user)
        await migraPartiteLocali(res.user)
      } else {
        const res = await signInWithPopup(auth, googleProvider)
        await saveUserToDb(res.user)
        await migraPartiteLocali(res.user)
      }
    } catch (e) {
      console.error(e)
      setError(t('login.erroreGoogle'))
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
          photoURL: null,
        })
        await migraPartiteLocali(res.user)
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password)
        await migraPartiteLocali(res.user)
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError(t('login.emailErrata'))
      } else if (e.code === 'auth/email-already-in-use') {
        setError(t('login.emailUsata'))
      } else if (e.code === 'auth/weak-password') {
        setError(t('login.passwordCorta'))
      } else {
        setError(t('login.errore'))
      }
    }
    setLoading(false)
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setError(t('login.emailReset'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setResetSent(true)
    } catch (e) {
      setError(t('login.emailNonTrovata'))
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <DenariLogo size={80} glow={true} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--cream)' }}>Scopa</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{t('login.sottotitolo')}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button onClick={() => window.history.back()} style={{
          background: 'none', border: 'none', color: 'var(--text-faint)',
          fontSize: '13px', marginBottom: '16px', cursor: 'pointer', padding: 0
        }}>
          ← {t('login.continua')}
        </button>

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
          {t('login.google')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--ink-muted)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{t('login.oppure')}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--ink-muted)' }} />
        </div>

        {mode === 'register' && (
          <input placeholder={t('login.nome')} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        )}

        <input placeholder={t('login.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder={t('login.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            {resetSent ? (
              <span style={{ fontSize: '12px', color: 'var(--success)' }}>
                {t('login.emailInviata')}
              </span>
            ) : (
              <button onClick={handleResetPassword} disabled={loading} style={{
                background: 'none', border: 'none',
                color: 'var(--text-faint)', fontSize: '12px',
                cursor: 'pointer', padding: 0
              }}>
                {t('login.passwordDimenticata')}
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleEmail} disabled={loading} className="btn-gold" style={{ marginBottom: '12px' }}>
          {loading ? '...' : mode === 'login' ? t('login.accedi') : t('login.registrati')}
        </button>

        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setResetSent(false) }} className="btn-ghost">
          {mode === 'login' ? t('login.nonHaiAccount') : t('login.haiAccount')}
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