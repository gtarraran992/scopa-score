import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { calcTotals } from '../config'

export default function Profilo({ user }) {
  const navigate = useNavigate()
  const [nome, setNome] = useState(user.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadStats() {
      const q = query(
        collection(db, 'partite'),
        where('uids', 'array-contains', user.uid),
        where('conclusa', '==', true)
      )
      const snap = await getDocs(q)
      const partite = snap.docs.map(d => d.data())

      let vinte = 0
      let perse = 0
      const avversariMap = {}

      partite.forEach(p => {
        const totals = calcTotals(p.players, p.mani || [])
        const scores = totals.map(t => t.total)
        const maxScore = Math.max(...scores)
        const winnerIdx = scores.indexOf(maxScore)

        // Trova l'indice del giocatore corrente nella partita
        // Le partite create dall'utente hanno sempre il suo nome come primo giocatore
        // Usiamo createdBy per identificare l'indice
        const myIdx = p.createdBy === user.uid ? 0 : -1
        if (myIdx === -1) return

        const hoVinto = winnerIdx === myIdx

        if (hoVinto) vinte++
        else perse++

        // Statistiche con avversari
        p.players.forEach((pl, pi) => {
          if (pi === myIdx) return
          const key = pl.name.trim().toLowerCase()
          if (!avversariMap[key]) {
            avversariMap[key] = { name: pl.name, partite: 0, vinteContro: 0 }
          }
          avversariMap[key].partite++
          if (hoVinto) avversariMap[key].vinteContro++
        })
      })

      const topAvversari = Object.values(avversariMap)
        .sort((a, b) => b.partite - a.partite)
        .slice(0, 4)

      setStats({ vinte, perse, totale: partite.length, topAvversari })
    }

    loadStats()
  }, [user.uid])

  async function saveName() {
    if (!nome.trim()) return
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { displayName: nome.trim() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pct = stats?.totale > 0 ? Math.round((stats.vinte / stats.totale) * 100) : 0

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>Profilo</h1>
      </div>

      {/* Avatar + nome */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--ink)',
          marginBottom: '12px'
        }}>
          {(nome || user.email)?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{user.email}</div>
      </div>

      {/* Modifica nome */}
      <div style={sectionTitle}>Nome visualizzato</div>
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', color: 'var(--cream)', fontSize: '15px'
          }}
          placeholder="Il tuo nome"
        />
        <button onClick={saveName} disabled={saving} style={{
          background: saved ? 'var(--success)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          border: 'none', borderRadius: 'var(--radius-md)',
          padding: '8px 16px', color: 'var(--ink)',
          fontSize: '13px', fontWeight: '500', flexShrink: 0,
          transition: 'background 0.2s'
        }}>
          {saved ? '✓' : saving ? '...' : 'Salva'}
        </button>
      </div>

      {/* Statistiche generali */}
      <div style={sectionTitle}>Statistiche</div>
      {!stats ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-faint)' }}>Caricamento...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Partite', value: stats.totale },
              { label: 'Vittorie', value: stats.vinte },
              { label: 'Sconfitte', value: stats.perse },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
                borderRadius: 'var(--radius-lg)', padding: '14px 10px', textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--gold)' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Percentuale vittoria */}
          <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Percentuale vittoria</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gold)' }}>{pct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--ink-muted)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                borderRadius: '3px', transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Top avversari */}
          {stats.topAvversari.length > 0 && (
            <>
              <div style={sectionTitle}>Giocatori più frequenti</div>
              <div className="card" style={{ marginBottom: '24px' }}>
                {stats.topAvversari.map((a, i) => {
                  const pctW = a.partite > 0 ? Math.round((a.vinteContro / a.partite) * 100) : 0
                  return (
                    <div key={i} style={{
                      padding: '14px 18px',
                      borderBottom: i < stats.topAvversari.length - 1 ? '1px solid var(--ink-muted)' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', color: 'var(--cream)' }}>{a.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {a.vinteContro}V / {a.partite - a.vinteContro}S · {a.partite} partite
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--ink-muted)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pctW}%`,
                          background: pctW >= 50 ? 'var(--success)' : 'var(--danger)',
                          borderRadius: '2px'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Logout */}
      <button className="btn-ghost" onClick={() => signOut(auth)} style={{ marginTop: '8px' }}>
        Esci dall'account
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