import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import { calcTotals } from '../config'

export default function Home({ user }) {
  const [partite, setPartite] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(
      collection(db, 'partite'),
      where('uids', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setPartite(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user.uid])

  const attive = partite.filter(p => !p.conclusa)
  const concluse = partite.filter(p => p.conclusa)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--gold)' }}>♠ Scopa</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Ciao, {user.displayName || user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/classifica')} style={iconBtn}>🏆</button>
          <button onClick={() => navigate('/profilo')} style={iconBtn}>👤</button>
          <button onClick={() => navigate('/amici')} style={iconBtn}>👥</button>
          <button onClick={() => signOut(auth)} style={iconBtn}>↩</button>
        </div>
      </div>

      {/* Nuova partita */}
      <button className="btn-gold" onClick={() => navigate('/nuova-partita')} style={{ marginBottom: '28px' }}>
        + Nuova partita
      </button>

      {/* Partite attive */}
      {attive.length > 0 && (
        <>
          <div style={sectionTitle}>In corso</div>
          {attive.map(p => <PartitaCard key={p.id} partita={p} user={user} onClick={() => navigate(`/partita/${p.id}`)} />)}
        </>
      )}

      {/* Partite concluse */}
      {concluse.length > 0 && (
        <>
          <div style={sectionTitle}>Concluse</div>
          {concluse.map(p => <PartitaCard key={p.id} partita={p} user={user} onClick={() => navigate(`/partita/${p.id}`)} />)}
        </>
      )}

      {partite.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🃏</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-muted)' }}>Nessuna partita</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Inizia una nuova partita!</p>
        </div>
      )}
    </div>
  )
}

function PartitaCard({ partita, user, onClick }) {
  const totals = calcTotals(partita.players, partita.mani || [])
  const scores = totals.map(t => t.total)
  const maxScore = Math.max(...scores)
  const winnerIdx = partita.conclusa ? scores.indexOf(maxScore) : -1

  return (
    <div className="card" onClick={onClick} style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {partita.conclusa ? 'Conclusa' : `Mano ${(partita.mani || []).length + 1}`}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
          Target: {partita.target}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {partita.players.map((p, pi) => (
          <div key={pi} style={{
            flex: 1, background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            border: winnerIdx === pi ? '1px solid var(--gold)' : '1px solid transparent'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: winnerIdx === pi ? 'var(--gold)' : 'var(--cream)' }}>
              {scores[pi]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const iconBtn = {
  background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
  borderRadius: 'var(--radius-md)', padding: '8px 12px',
  fontSize: '16px', color: 'var(--cream)'
}

const sectionTitle = {
  fontSize: '12px', fontWeight: '500', letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  marginBottom: '12px'
}