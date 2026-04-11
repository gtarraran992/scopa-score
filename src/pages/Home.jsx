import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import { calcTotals } from '../config'
import { getPartiteLocali, deletePartitaLocale } from '../localDB'

export default function Home({ user, isGuest }) {
  const [partite, setPartite] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isGuest) {
      // Modalità ospite — carica da localStorage
      setPartite(getPartiteLocali())
      return
    }

    // Modalità utente — carica da Firestore
    const q = query(
      collection(db, 'partite'),
      where('uids', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setPartite(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user, isGuest])

  async function confirmDelete() {
    if (isGuest) {
      deletePartitaLocale(deletingId)
      setPartite(getPartiteLocali())
    } else {
      await deleteDoc(doc(db, 'partite', deletingId))
    }
    setDeletingId(null)
  }

  const attive = partite.filter(p => !p.conclusa)
  const concluse = partite.filter(p => p.conclusa)

  return (
    <div className="page">

      {/* Modale elimina */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#242438', border: '1px solid var(--gold)', borderRadius: '16px', padding: '28px 24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ color: '#f0ebe0', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>
              Eliminare questa partita?
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeletingId(null)} style={btnCancel}>Annulla</button>
              <button onClick={confirmDelete} style={btnConfirm}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--gold)' }}>♠ Scopa</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isGuest ? 'Modalità ospite' : `Ciao, ${user.displayName || user.email}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isGuest && <button onClick={() => navigate('/classifica')} style={iconBtn}>🏆</button>}
          {!isGuest && <button onClick={() => navigate('/profilo')} style={iconBtn}>👤</button>}
          {!isGuest && <button onClick={() => navigate('/amici')} style={iconBtn}>👥</button>}
          {isGuest
            ? <button onClick={() => navigate('/login')} style={{ ...iconBtn, color: 'var(--gold)', borderColor: 'var(--gold)', fontSize: '12px', padding: '8px 12px' }}>Accedi</button>
            : <button onClick={() => signOut(auth)} style={iconBtn}>↩</button>
          }
        </div>
      </div>

      {/* Banner ospite */}
      {isGuest && (
        <div style={{
          background: 'rgba(201,150,58,0.1)', border: '1px solid var(--gold)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
          marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Stai giocando come ospite. Registrati per salvare le partite nel cloud e accedere alle classifiche.
          </span>
          <button onClick={() => navigate('/login')} style={{
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '8px 14px', color: 'var(--ink)',
            fontSize: '12px', fontWeight: '500', flexShrink: 0, cursor: 'pointer'
          }}>
            Registrati
          </button>
        </div>
      )}

      {/* Nuova partita */}
      <button className="btn-gold" onClick={() => navigate('/nuova-partita')} style={{ marginBottom: '28px' }}>
        + Nuova partita
      </button>

      {/* Partite attive */}
      {attive.length > 0 && (
        <>
          <div style={sectionTitle}>In corso</div>
          {attive.map(p => (
            <PartitaCard
              key={p.id}
              partita={p}
              onClick={() => navigate(`/partita/${p.id}`)}
              onDelete={e => { e.stopPropagation(); setDeletingId(p.id) }}
            />
          ))}
        </>
      )}

      {/* Partite concluse */}
      {concluse.length > 0 && (
        <>
          <div style={sectionTitle}>Concluse</div>
          {concluse.map(p => (
            <PartitaCard
              key={p.id}
              partita={p}
              onClick={() => navigate(`/partita/${p.id}`)}
              onDelete={e => { e.stopPropagation(); setDeletingId(p.id) }}
            />
          ))}
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

function PartitaCard({ partita, onClick, onDelete }) {
  const totals = calcTotals(partita.players, partita.mani || [])
  const scores = totals.map(t => t.total)
  const maxScore = Math.max(...scores)
  const winnerIdx = partita.conclusa && scores.filter(s => s === maxScore).length === 1
    ? scores.indexOf(maxScore) : -1

  const data = partita.createdAt?.toDate
    ? partita.createdAt.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : partita.createdAt
      ? new Date(partita.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      : ''

  return (
    <div className="card" onClick={onClick} style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {partita.conclusa ? 'Conclusa' : `Mano ${(partita.mani || []).length + 1}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{data}</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '16px', padding: '2px 4px', lineHeight: 1 }}>✕</button>
        </div>
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

const btnConfirm = { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #c9963a, #e8b84b)', border: 'none', borderRadius: '10px', color: '#1a1a2e', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }
const btnCancel = { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #3d3d58', borderRadius: '10px', color: '#9b95a8', fontSize: '14px', cursor: 'pointer' }