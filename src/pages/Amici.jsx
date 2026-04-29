import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useTranslation } from 'react-i18next'

export default function Amici({ user }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [amici, setAmici] = useState([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let unsubAmici = null
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), snap => {
      const data = snap.data()
      if (unsubAmici) unsubAmici()
      if (data?.friends?.length > 0) {
        const q = query(collection(db, 'users'), where('uid', 'in', data.friends))
        unsubAmici = onSnapshot(q, s => setAmici(s.docs.map(d => d.data())))
      } else {
        setAmici([])
      }
    })
    return () => {
      unsubUser()
      if (unsubAmici) unsubAmici()
    }
  }, [user.uid])

  async function searchUsers() {
    if (!search.trim()) return
    setLoading(true)
    setResults([])
    const q = query(collection(db, 'users'), where('email', '==', search.trim().toLowerCase()))
    const snap = await getDocs(q)
    const found = snap.docs.map(d => d.data()).filter(u => u.uid !== user.uid)
    setResults(found)
    if (found.length === 0) setMessage(t('amici.nessunoTrovato'))
    else setMessage('')
    setLoading(false)
  }

  async function addAmico(amico) {
    await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(amico.uid) })
    await updateDoc(doc(db, 'users', amico.uid), { friends: arrayUnion(user.uid) })
    setResults([])
    setSearch('')
    setMessage(t('amici.aggiunto', { nome: amico.displayName }))
  }

  async function removeAmico(amico) {
    await updateDoc(doc(db, 'users', user.uid), { friends: arrayRemove(amico.uid) })
    await updateDoc(doc(db, 'users', amico.uid), { friends: arrayRemove(user.uid) })
  }

  const friendUids = amici.map(a => a.uid)

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>{t('amici.titolo')}</h1>
      </div>

      <div style={sectionTitle}>{t('amici.cercaEmail')}</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchUsers()}
          placeholder="email@esempio.com"
          type="email"
          style={{
            flex: 1, padding: '12px 16px',
            background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
            borderRadius: 'var(--radius-md)', color: 'var(--cream)', fontSize: '15px'
          }}
        />
        <button onClick={searchUsers} disabled={loading} style={{
          padding: '12px 18px',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          border: 'none', borderRadius: 'var(--radius-md)',
          color: 'var(--ink)', fontWeight: '500', fontSize: '14px'
        }}>
          {loading ? '...' : t('amici.cerca')}
        </button>
      </div>

      {message && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {results.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          {results.map(u => (
            <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <div>
                <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{u.displayName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{u.email}</div>
              </div>
              {friendUids.includes(u.uid) ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('amici.giaAmico')}</span>
              ) : (
                <button onClick={() => addAmico(u)} style={{
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '8px 14px', color: 'var(--ink)', fontSize: '13px', fontWeight: '500'
                }}>
                  {t('amici.aggiungi')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={sectionTitle}>{t('amici.iTuoiAmici')}</div>
      {amici.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('amici.nessunoAmico')}</p>
          <p style={{ fontSize: '12px', marginTop: '6px' }}>{t('amici.cercaPerEmail')}</p>
        </div>
      ) : (
        <div className="card">
          {amici.map((a, i) => (
            <div key={a.uid} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: i < amici.length - 1 ? '1px solid var(--ink-muted)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'var(--ink-muted)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', color: 'var(--gold)', fontFamily: 'var(--font-display)'
                }}>
                  {a.displayName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{a.displayName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{a.email}</div>
                </div>
              </div>
              <button onClick={() => removeAmico(a)} style={{
                background: 'none', border: '1px solid var(--ink-muted)',
                borderRadius: 'var(--radius-md)', padding: '6px 12px',
                color: 'var(--text-faint)', fontSize: '12px'
              }}>
                {t('amici.rimuovi')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const backBtn = {
  background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
  borderRadius: 'var(--radius-md)', padding: '8px 14px',
  fontSize: '16px', color: 'var(--cream)'
}

const sectionTitle = {
  fontSize: '12px', fontWeight: '500', letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  marginBottom: '10px'
}