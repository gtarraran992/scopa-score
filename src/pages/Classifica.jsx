import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { calcTotals } from '../config'

export default function Classifica({ user }) {
  const navigate = useNavigate()
  const [classifica, setClassifica] = useState(null)

  useEffect(() => {
    async function loadClassifica() {
      // Prendi la lista amici
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const friends = userSnap.data()?.friends || []
      const allUids = [user.uid, ...friends]

      // Prendi tutte le partite concluse che coinvolgono almeno uno degli amici
      const q = query(
        collection(db, 'partite'),
        where('uids', 'array-contains', user.uid),
        where('conclusa', '==', true)
      )
      const snap = await getDocs(q)
      const partite = snap.docs.map(d => d.data())

      // Prendi i profili degli amici
      const profileMap = {}
      profileMap[user.uid] = { uid: user.uid, displayName: user.displayName || user.email, partite: 0, vinte: 0 }

      for (const uid of friends) {
        const s = await getDoc(doc(db, 'users', uid))
        if (s.exists()) {
          profileMap[uid] = { uid, displayName: s.data().displayName, partite: 0, vinte: 0 }
        }
      }

      // Calcola statistiche per ogni uid
      partite.forEach(p => {
        const totals = calcTotals(p.players, p.mani || [])
        const scores = totals.map(t => t.total)
        const maxScore = Math.max(...scores)
        const winnerIdx = scores.filter(s => s === maxScore).length === 1
          ? scores.indexOf(maxScore) : -1

        // Solo il creatore è tracciabile per uid
        if (p.createdBy && profileMap[p.createdBy]) {
          profileMap[p.createdBy].partite++
          if (winnerIdx === 0) profileMap[p.createdBy].vinte++
        }
      })

      const risultati = Object.values(profileMap)
        .filter(p => p.partite > 0)
        .map(p => ({
          ...p,
          perse: p.partite - p.vinte,
          pct: Math.round((p.vinte / p.partite) * 100)
        }))
        .sort((a, b) => b.vinte - a.vinte || b.pct - a.pct)

      setClassifica(risultati)
    }

    loadClassifica()
  }, [user.uid])

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>Classifica</h1>
      </div>

      {!classifica ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
          Caricamento...
        </div>
      ) : classifica.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '18px' }}>Nessuna partita ancora</p>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '6px' }}>Aggiungi amici e gioca per vedere la classifica</p>
        </div>
      ) : (
        <div className="card">
          {/* Header tabella */}
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 48px 48px 48px',
            gap: '8px', padding: '10px 18px',
            borderBottom: '1px solid var(--ink-muted)',
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text-faint)'
          }}>
            <span>#</span>
            <span>Giocatore</span>
            <span style={{ textAlign: 'center' }}>V</span>
            <span style={{ textAlign: 'center' }}>S</span>
            <span style={{ textAlign: 'right' }}>%</span>
          </div>

          {classifica.map((p, i) => {
            const isMe = p.uid === user.uid
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={p.uid} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 48px 48px 48px',
                gap: '8px', padding: '14px 18px',
                borderBottom: i < classifica.length - 1 ? '1px solid var(--ink-muted)' : 'none',
                background: isMe ? 'rgba(201,150,58,0.06)' : 'transparent',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '16px' }}>
                  {i < 3 ? medals[i] : <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{i + 1}</span>}
                </span>
                <div>
                  <div style={{ fontSize: '15px', color: isMe ? 'var(--gold)' : 'var(--cream)', fontWeight: isMe ? '500' : '400' }}>
                    {p.displayName} {isMe && <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>(tu)</span>}
                  </div>
                  <div style={{ height: '3px', background: 'var(--ink-muted)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${p.pct}%`,
                      background: p.pct >= 50 ? 'var(--success)' : 'var(--danger)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
                <span style={{ textAlign: 'center', fontSize: '14px', color: 'var(--success)', fontWeight: '500' }}>{p.vinte}</span>
                <span style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>{p.perse}</span>
                <span style={{ textAlign: 'right', fontSize: '14px', color: 'var(--gold)' }}>{p.pct}%</span>
              </div>
            )
          })}
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