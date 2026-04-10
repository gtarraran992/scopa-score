import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { PUNTI, calcTotals } from '../config'

export default function Partita({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [partita, setPartita] = useState(null)
  const [tab, setTab] = useState('punteggio')
  const [current, setCurrent] = useState({})
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [deletingMano, setDeletingMano] = useState(null)
  const [showVittoria, setShowVittoria] = useState(false)
  const eraConclusa = useRef(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'partite', id), snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setPartita(prev => {
          if (prev === null) {
            eraConclusa.current = data.conclusa
          } else if (data.conclusa && !eraConclusa.current) {
            setShowVittoria(true)
            eraConclusa.current = true
          }
          return data
        })
      }
    })
    return unsub
  }, [id])

  if (!partita) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '24px' }}>♠</span>
    </div>
  )

  const opzioni = partita.opzioni || { rebello: true, napoli: true }
  const mani = partita.mani || []
  const totals = calcTotals(partita.players, mani)
  const scores = totals.map(t => t.total)
  const maxScore = Math.max(...scores)
  const hasWinner = maxScore >= partita.target && mani.length > 0 && scores.filter(s => s === maxScore).length === 1
  const winnerIdx = hasWinner ? scores.indexOf(maxScore) : -1

  const puntiAttivi = PUNTI.filter(pt => {
    if (pt.key === 'rebello' && !opzioni.rebello) return false
    return true
  })

  const pills = [
    { key: 'carte', label: 'Carte' },
    { key: 'oro', label: 'Ori' },
    { key: 'settebello', label: '7♦' },
    ...(opzioni.rebello ? [{ key: 'rebello', label: 'R♦' }] : []),
    { key: 'primiera', label: 'Prim.' },
    { key: 'scope', label: 'Scope' },
    ...(opzioni.napoli !== false ? [{ key: 'napoli', label: 'Napoli' }] : []),
  ]

  const counterFields = ['scope', ...(opzioni.napoli !== false ? ['napoli'] : [])]

  function isTakenByOther(pi, key) {
    return partita.players.some((_, otherPi) => otherPi !== pi && !!(current[otherPi]?.[key]))
  }

  function togglePoint(pi, key) {
    setCurrent(c => {
      const cur = { ...(c[pi] || {}) }
      cur[key] = cur[key] ? 0 : 1
      return { ...c, [pi]: cur }
    })
  }

  function changeCounter(pi, field, delta) {
    const max = field === 'napoli' ? 10 : field === 'scope' ? 18 : 999
    setCurrent(c => {
      const cur = { ...(c[pi] || {}) }
      cur[field] = Math.min(max, Math.max(0, (cur[field] || 0) + delta))
      return { ...c, [pi]: cur }
    })
  }

  async function confirmMano() {
    const obbligatori = ['settebello', ...(opzioni.rebello ? ['rebello'] : [])]
    for (const key of obbligatori) {
      const assegnato = partita.players.some((_, pi) => !!(current[pi]?.[key]))
      if (!assegnato) {
        setError(`Assegna "${key === 'settebello' ? 'Sette bello' : 'Re bello'}" a uno dei giocatori.`)
        return
      }
    }
    setError('')
    const mano = {}
    partita.players.forEach((_, pi) => {
      const cur = current[pi] || {}
      const total = puntiAttivi.reduce((s, pt) => s + (cur[pt.key] || 0), 0)
        + (cur.scope || 0)
        + (opzioni.napoli !== false ? (cur.napoli || 0) : 0)
      mano[pi] = { ...cur, total }
    })
    const nuoveMani = [...mani, mano]
    const nuoviScores = calcTotals(partita.players, nuoveMani).map(t => t.total)
    const nuovoMax = Math.max(...nuoviScores)
    const conclusa = nuovoMax >= partita.target && nuoviScores.filter(s => s === nuovoMax).length === 1

    await updateDoc(doc(db, 'partite', id), {
      mani: nuoveMani,
      conclusa,
      ...(conclusa ? { conclusaAt: serverTimestamp() } : {})
    })
    setCurrent({})
    setTab('punteggio')
  }

  async function deleteMano(mi) {
    const nuoveMani = mani.filter((_, i) => i !== mi)
    await updateDoc(doc(db, 'partite', id), { mani: nuoveMani, conclusa: false })
    setDeletingMano(null)
  }

  async function resetPartita() {
    await updateDoc(doc(db, 'partite', id), { mani: [], conclusa: false })
    setCurrent({})
    setShowReset(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 'var(--safe-top)' }}>

      {error && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
          <div style={modalText}>{error}</div>
          <button onClick={() => setError('')} style={{ ...btnConfirm, padding: '12px 32px' }}>Ok</button>
        </Modal>
      )}

      {showReset && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🃏</div>
          <div style={modalText}>Resettare la partita?</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowReset(false)} style={btnCancel}>Annulla</button>
            <button onClick={resetPartita} style={btnConfirm}>Reset</button>
          </div>
        </Modal>
      )}

      {showVittoria && partita.conclusa && winnerIdx !== -1 && (
        <Modal>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)', marginBottom: '8px' }}>
            {partita.players[winnerIdx].name} ha vinto!
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {scores.map((s, i) => `${partita.players[i].name}: ${s}`).join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setShowVittoria(false); navigate('/') }} style={btnCancel}>Home</button>
            <button onClick={() => { setShowVittoria(false); navigate('/nuova-partita') }} style={btnConfirm}>Nuova partita</button>
          </div>
        </Modal>
      )}

      {deletingMano !== null && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
          <div style={modalText}>Eliminare la mano {deletingMano + 1}?</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setDeletingMano(null)} style={btnCancel}>Annulla</button>
            <button onClick={() => deleteMano(deletingMano)} style={btnConfirm}>Elimina</button>
          </div>
        </Modal>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--ink-muted)', flexShrink: 0
      }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--cream)' }}>
          {partita.conclusa ? '🏆 Partita conclusa' : `Mano ${mani.length + 1}`}
        </span>
        <button onClick={() => setShowReset(true)} style={backBtn}>↺</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--ink-muted)', flexShrink: 0 }}>
        {['punteggio', ...(partita.conclusa ? [] : ['mano']), 'storico'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}`,
            color: tab === t ? 'var(--gold)' : 'var(--text-faint)',
            fontSize: '12px', fontWeight: '500', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '-1px'
          }}>
            {t === 'punteggio' ? 'Punteggio' : t === 'mano' ? 'Nuova mano' : 'Storico'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px calc(16px + var(--safe-bottom))' }}>

        {tab === 'punteggio' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: partita.players.length > 2 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
              {partita.players.map((p, pi) => {
                const t = totals[pi]
                const isWinner = winnerIdx === pi
                const pct = Math.min(100, Math.round((t.total / partita.target) * 100))
                return (
                  <div key={pi} style={{
                    background: 'var(--ink-soft)',
                    border: `${isWinner ? '2px' : '1px'} solid ${isWinner ? 'var(--gold)' : 'var(--ink-muted)'}`,
                    borderRadius: 'var(--radius-lg)', padding: '16px', position: 'relative', overflow: 'hidden'
                  }}>
                    {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }} />}
                    {isWinner && <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--ink)', fontSize: '10px', fontWeight: '500', padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.05em' }}>VINCITORE</span>}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--cream)', marginBottom: '8px' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: isWinner ? 'var(--gold)' : 'var(--cream)', lineHeight: 1 }}>{t.total}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>/ {partita.target}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--ink-muted)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'var(--success)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {pills.map(pill => (
                        <div key={pill.key} style={{ background: 'var(--ink-muted)', borderRadius: '20px', padding: '3px 9px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
                          {pill.label} <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{t[pill.key] || 0}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {!partita.conclusa && (
              <button className="btn-gold" onClick={() => setTab('mano')}>Registra mano →</button>
            )}
          </>
        )}

        {tab === 'mano' && (
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--cream)' }}>Mano {mani.length + 1}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Seleziona i punti vinti</span>
            </div>

            {partita.players.map((p, pi) => {
              const cur = current[pi] || {}
              return (
                <div key={pi} style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink-muted)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>{p.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    {puntiAttivi.map(pt => {
                      const on = !!cur[pt.key]
                      const disabled = !on && isTakenByOther(pi, pt.key)
                      return (
                        <button key={pt.key} onClick={() => !disabled && togglePoint(pi, pt.key)} disabled={disabled} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '11px 13px', borderRadius: '12px', fontSize: '13px',
                          background: on ? 'rgba(201,150,58,0.12)' : 'var(--ink-muted)',
                          border: `1px solid ${on ? 'var(--gold)' : 'transparent'}`,
                          color: on ? 'var(--gold-light)' : 'var(--text-muted)',
                          opacity: disabled ? 0.3 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                          textAlign: 'left'
                        }}>
                          <span style={{
                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                            border: `1.5px solid ${on ? 'var(--gold)' : 'var(--text-faint)'}`,
                            background: on ? 'var(--gold)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {on && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--ink)' }} />}
                          </span>
                          {pt.label}
                        </button>
                      )
                    })}
                  </div>
                  {counterFields.map(field => (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{field}</span>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <button onClick={() => changeCounter(pi, field, -1)} style={stepBtn}>−</button>
                        <span style={{ width: '38px', textAlign: 'center', fontSize: '15px', fontWeight: '500', color: 'var(--cream)', borderLeft: '1px solid var(--ink-soft)', borderRight: '1px solid var(--ink-soft)', lineHeight: '38px' }}>{cur[field] || 0}</span>
                        <button onClick={() => changeCounter(pi, field, 1)} style={stepBtn}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            <button className="btn-gold" onClick={confirmMano} style={{ borderRadius: 0, borderTop: '1px solid var(--ink-muted)' }}>
              Conferma mano {mani.length + 1}
            </button>
          </div>
        )}

        {tab === 'storico' && (
          mani.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>♠</div>
              <p style={{ color: 'var(--text-muted)' }}>Nessuna mano ancora</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--ink-muted)' }}>
                Mani giocate
              </div>
              {[...mani].reverse().map((m, rmi) => {
                const mi = mani.length - 1 - rmi
                return (
                  <div key={mi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: rmi < mani.length - 1 ? '1px solid var(--ink-muted)' : 'none', fontSize: '14px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--cream)', minWidth: '60px' }}>Mano {mi + 1}</span>
                    <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)', fontSize: '13px', flex: 1, flexWrap: 'wrap' }}>
                      {partita.players.map((p, pi) => (
                        <span key={pi}>{p.name}: <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{m[pi]?.total || 0}</b></span>
                      ))}
                    </div>
                    <button onClick={() => setDeletingMano(mi)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '16px', padding: '4px 6px' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function Modal({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ background: '#242438', border: '1px solid var(--gold)', borderRadius: '16px', padding: '28px 24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
        {children}
      </div>
    </div>
  )
}

const modalText = { color: '#f0ebe0', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }
const btnConfirm = { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #c9963a, #e8b84b)', border: 'none', borderRadius: '10px', color: '#1a1a2e', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }
const btnCancel = { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #3d3d58', borderRadius: '10px', color: '#9b95a8', fontSize: '14px', cursor: 'pointer' }
const backBtn = { background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: '16px', color: 'var(--cream)' }
const stepBtn = { width: '40px', height: '38px', background: 'none', border: 'none', color: 'var(--cream)', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
