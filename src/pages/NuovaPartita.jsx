import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_TARGET } from '../config'
import { savePartitaLocale, generateId } from '../localDB'

export default function NuovaPartita({ user, isGuest }) {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([
    { name: isGuest ? '' : (user?.displayName || user?.email?.split('@')[0] || '') },
    { name: '' },
  ])
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [opzioni, setOpzioni] = useState({ rebello: true, napoli: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateName(i, val) {
    setPlayers(ps => ps.map((p, pi) => pi === i ? { ...p, name: val } : p))
  }

  function addPlayer() {
    if (players.length < 6) setPlayers(ps => [...ps, { name: '' }])
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
        // Salva in localStorage
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
        // Salva su Firestore
        const ref = await addDoc(collection(db, 'partite'), {
          players: players.map(p => ({ name: p.name.trim() })),
          uids: [user.uid],
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

  return (
    <div className="page">
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
            <input
              value={p.name}
              onChange={e => updateName(i, e.target.value)}
              placeholder={`Giocatore ${i + 1}`}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', color: 'var(--cream)', fontSize: '15px'
              }}
            />
            {players.length > 2 && (
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