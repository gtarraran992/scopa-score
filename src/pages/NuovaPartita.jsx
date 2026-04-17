import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_TARGET } from '../config'
import { savePartitaLocale, generateId } from '../localDB'

export default function NuovaPartita({ user, isGuest }) {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([
    { name: isGuest ? '' : (user?.displayName || user?.email?.split('@')[0] || ''), uid: isGuest ? null : user?.uid },
    { name: '', uid: null },
  ])
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [opzioni, setOpzioni] = useState({ rebello: true, napoli: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amici, setAmici] = useState([])
  const [showAmiciPicker, setShowAmiciPicker] = useState(null) // indice giocatore

  // Carica amici
  useEffect(() => {
    if (isGuest || !user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data()
      if (data?.friends?.length > 0) {
        const q = query(collection(db, 'users'), where('uid', 'in', data.friends))
        getDocs(q).then(s => setAmici(s.docs.map(d => d.data())))
      }
    })
  }, [user, isGuest])

  function updateName(i, val) {
    setPlayers(ps => ps.map((p, pi) => pi === i ? { ...p, name: val, uid: null } : p))
  }

  function selectAmico(i, amico) {
    setPlayers(ps => ps.map((p, pi) => pi === i ? { name: amico.displayName, uid: amico.uid } : p))
    setShowAmiciPicker(null)
  }

  function addPlayer() {
    if (players.length < 6) setPlayers(ps => [...ps, { name: '', uid: null }])
  }

  function removePlayer(i) {
    if (players.length > 2) setPlayers(ps => ps.filter((_, pi) => pi !== i))
  }

  async function startGame() {
    if (players.some(p => !p.name.trim())) {
      setError('Inserisci il nome di tutti i giocatori.')
      return
    }
    setLoading(true)
    try {
      if (isGuest) {
        const partita = {
          id: generateId(),
          players: players.map(p => ({ name: p.name.trim() })),
          target,
          opzioni,
          mani: [],
          conclusa: false,
          createdAt: new Date().toISOString(),
        }
        savePartitaLocale(partita)
        navigate(`/partita/${partita.id}`)
      } else {
        // Raccoglie gli uid di tutti i giocatori con account
        const uids = [user.uid, ...players.slice(1).filter(p => p.uid).map(p => p.uid)]
        const ref = await addDoc(collection(db, 'partite'), {
          players: players.map(p => ({ name: p.name.trim(), uid: p.uid || null })),
          uids,
          target,
          opzioni,
          mani: [],
          conclusa: false,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        })
        navigate(`/partita/${ref.id}`)
      }
    } catch (e) {
      setError('Errore durante la creazione. Riprova.')
      setLoading(false)
    }
  }

  // Amici già selezionati (esclude dal picker)
  const amiciSelezionati = players.map(p => p.uid).filter(Boolean)

  return (
    <div className="page">
      {/* Picker amici */}
      {showAmiciPicker !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--ink-soft)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '24px', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--cream)', marginBottom: '16px' }}>
              Seleziona un amico
            </div>
            {amici.filter(a => !amiciSelezionati.includes(a.uid) || players[showAmiciPicker]?.uid === a.uid).map(a => (
              <div key={a.uid} onClick={() => selectAmico(showAmiciPicker, a)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: players[showAmiciPicker]?.uid === a.uid ? 'rgba(201,150,58,0.12)' : 'var(--ink-muted)',
                border: `1px solid ${players[showAmiciPicker]?.uid === a.uid ? 'var(--gold)' : 'transparent'}`,
                marginBottom: '8px', cursor: 'pointer'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--ink-soft)', display: 'flex',
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
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => {
                setPlayers(ps => ps.map((p, pi) => pi === showAmiciPicker ? { name: '', uid: null } : p))
                setShowAmiciPicker(null)
              }} style={btnCancel}>Inserisci manualmente</button>
              <button onClick={() => setShowAmiciPicker(null)} style={btnConfirm}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>Nuova partita</h1>
      </div>

      <div style={sectionTitle}>Giocatori</div>
      <div className="card" style={{ marginBottom: '20px' }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px',
            borderBottom: i < players.length - 1 ? '1px solid var(--ink-muted)' : 'none'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--ink-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0
            }}>
              {i + 1}
            </div>
            {p.uid && p.uid !== user?.uid ? (
              // Amico selezionato
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gold)' }}>👥 Amico</div>
                </div>
                <button onClick={() => setShowAmiciPicker(i)} style={{
                  background: 'none', border: '1px solid var(--ink-muted)',
                  borderRadius: 'var(--radius-md)', padding: '4px 10px',
                  color: 'var(--text-faint)', fontSize: '12px'
                }}>Cambia</button>
              </div>
            ) : i === 0 ? (
              // Primo giocatore — non modificabile se loggato
              <span style={{ flex: 1, fontSize: '15px', color: 'var(--cream)' }}>{p.name}</span>
            ) : (
              // Altri giocatori — input + bottone amici
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  value={p.name}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder={`Giocatore ${i + 1}`}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', color: 'var(--cream)', fontSize: '15px'
                  }}
                />
                {!isGuest && amici.length > 0 && (
                  <button onClick={() => setShowAmiciPicker(i)} style={{
                    background: 'none', border: '1px solid var(--ink-muted)',
                    borderRadius: 'var(--radius-md)', padding: '4px 10px',
                    color: 'var(--gold)', fontSize: '12px', flexShrink: 0
                  }}>👥</button>
                )}
              </div>
            )}
            {players.length > 2 && i > 0 && (
              <button onClick={() => removePlayer(i)} style={{
                background: 'none', border: 'none',
                color: 'var(--text-faint)', fontSize: '18px', padding: '4px'
              }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {players.length < 6 && (
        <button className="btn-ghost" onClick={addPlayer} style={{ marginBottom: '24px' }}>
          + Aggiungi giocatore
        </button>
      )}

      <div style={sectionTitle}>Punti per vincere</div>
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Target</span>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button onClick={() => setTarget(t => Math.max(5, t - 1))} style={stepBtn}>−</button>
            <span style={{ width: '48px', textAlign: 'center', fontSize: '16px', fontWeight: '500', color: 'var(--cream)' }}>{target}</span>
            <button onClick={() => setTarget(t => t + 1)} style={stepBtn}>+</button>
          </div>
        </div>
      </div>

      <div style={sectionTitle}>Variante</div>
      <div className="card" style={{ marginBottom: '28px' }}>
        {[
          { key: 'rebello', label: 'Re bello', desc: 'Il re di denari vale 1 punto' },
          { key: 'napoli', label: 'Napoli', desc: 'Sequenza di denari vale punti extra' },
        ].map((opt, i) => (
          <div key={opt.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: i === 0 ? '1px solid var(--ink-muted)' : 'none'
          }}>
            <div>
              <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{opt.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>{opt.desc}</div>
            </div>
            <div
              onClick={() => setOpzioni(o => ({ ...o, [opt.key]: !o[opt.key] }))}
              style={{
                width: '44px', height: '26px', borderRadius: '13px',
                background: opzioni[opt.key] ? 'var(--gold)' : 'var(--ink-muted)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: opzioni[opt.key] ? '21px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s'
              }} />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
          ⚠ {error}
        </div>
      )}

      <button className="btn-gold" onClick={startGame} disabled={loading}>
        {loading ? '...' : 'Inizia partita'}
      </button>
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

const stepBtn = {
  width: '40px', height: '38px', background: 'none', border: 'none',
  color: 'var(--cream)', fontSize: '20px', display: 'flex',
  alignItems: 'center', justifyContent: 'center'
}

const btnConfirm = { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #c9963a, #e8b84b)', border: 'none', borderRadius: '10px', color: '#1a1a2e', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }
const btnCancel = { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #3d3d58', borderRadius: '10px', color: '#9b95a8', fontSize: '13px', cursor: 'pointer' }