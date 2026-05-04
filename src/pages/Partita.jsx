import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { PUNTI, calcTotals } from '../config'
import { getPartitaLocale, savePartitaLocale } from '../localDB'
import confetti from 'canvas-confetti'
import { playSound } from '../utils/audio'
import DenariLogo from '../components/DenariLogo'
import { useTranslation } from 'react-i18next'

function calcTotalsSquadre(squadre, mani) {
  return squadre.map((_, si) => {
    const total = mani.reduce((s, m) => s + (m[si]?.total || 0), 0)
    const byKey = {}
    PUNTI.forEach(pt => {
      byKey[pt.key] = mani.reduce((s, m) => s + (m[si]?.[pt.key] || 0), 0)
    })
    byKey.scope = mani.reduce((s, m) => s + (m[si]?.scope || 0), 0)
    byKey.napoli = mani.reduce((s, m) => s + (m[si]?.napoli || 0), 0)
    return { ...byKey, total }
  })
}

function getMyIdx(players, user, createdBy) {
  const idx = players.findIndex(pl => pl.uid === user?.uid)
  return idx === -1 && createdBy === user?.uid ? 0 : idx
}

function getMySquadra(squadre, user, createdBy) {
  const idx = squadre.findIndex(s => s.players.some(p => p.uid === user?.uid))
  if (idx !== -1) return idx
  const isCreator = createdBy === user?.uid
  if (isCreator) return 0
  return -1
}

export default function Partita({ user, isGuest }) {
  const { t } = useTranslation()
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

  const LOCAL_KEY = `partita_in_corso_${id}`
  const isSquadre = partita?.modalita === 'squadre'

  useEffect(() => {
    if (isGuest) {
      const p = getPartitaLocale(id)
      if (p) {
        eraConclusa.current = p.conclusa
        setPartita(p)
      }
      return
    }

    const unsub = onSnapshot(doc(db, 'partite', id), snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setPartita(prev => {
          if (prev === null) {
            const saved = localStorage.getItem(LOCAL_KEY)
            if (saved) {
              const { mani: maniLocali } = JSON.parse(saved)
              eraConclusa.current = data.conclusa
              return { ...data, mani: maniLocali }
            }
            eraConclusa.current = data.conclusa
            return data
          } else if (data.conclusa && !eraConclusa.current) {
            setShowVittoria(true)
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#c9963a', '#e8b84b', '#f5f0e8', '#4caf6e'] })
            if (data.modalita === 'squadre') {
              const snapTotals = calcTotalsSquadre(data.squadre, data.mani || []).map(t => t.total)
              const winnerSi = snapTotals.indexOf(Math.max(...snapTotals))
              const mySquadra = getMySquadra(data.squadre, user, data.createdBy)
              playSound(mySquadra === winnerSi ? 'vittoria' : 'sconfitta')
            } else {
              const snapTotals = calcTotals(data.players, data.mani || []).map(t => t.total)
              const snapWinnerIdx = snapTotals.indexOf(Math.max(...snapTotals))
              const myIdx = getMyIdx(data.players, user, data.createdBy)
              playSound(myIdx === snapWinnerIdx ? 'vittoria' : 'sconfitta')
            }
            eraConclusa.current = true
          }
          return { ...data, mani: prev.mani }
        })
      }
    })
    return unsub
  }, [id, isGuest])

  function updatePartitaLocale(updates) {
    const updated = { ...partita, ...updates }
    savePartitaLocale(updated)
    setPartita(updated)
    return updated
  }

  if (!partita) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DenariLogo size={80} glow={true} />
    </div>
  )

  const opzioni = partita.opzioni || { rebello: true, napoli: true }
  const mani = partita.mani || []

  const totals = !isSquadre ? calcTotals(partita.players, mani) : []
  const scores = !isSquadre ? totals.map(t => t.total) : []
  const maxScore = !isSquadre ? Math.max(...scores) : 0
  const hasWinner = !isSquadre && maxScore >= partita.target && mani.length > 0 && scores.filter(s => s === maxScore).length === 1
  const winnerIdx = hasWinner ? scores.indexOf(maxScore) : -1

  const totalsSquadre = isSquadre ? calcTotalsSquadre(partita.squadre, mani) : []
  const scoresSquadre = isSquadre ? totalsSquadre.map(t => t.total) : []
  const maxScoreSquadre = isSquadre ? Math.max(...scoresSquadre) : 0
  const hasWinnerSquadre = isSquadre && maxScoreSquadre >= partita.target && mani.length > 0 && scoresSquadre.filter(s => s === maxScoreSquadre).length === 1
  const winnerSquadraIdx = hasWinnerSquadre ? scoresSquadre.indexOf(maxScoreSquadre) : -1

  const puntiAttivi = PUNTI.filter(pt => {
    if (pt.key === 'rebello' && !opzioni.rebello) return false
    return true
  })

  const labelMap = {
    carte: t('partita.carte'),
    denaro: t('partita.denari'),
    settebello: t('partita.setteBello'),
    rebello: t('partita.reBello'),
    primiera: t('partita.primiera'),
  }

  const pills = [
    { key: 'carte', label: t('partita.carte') },
    { key: 'denaro', label: t('partita.denari') },
    { key: 'settebello', label: '7♦' },
    ...(opzioni.rebello ? [{ key: 'rebello', label: 'R♦' }] : []),
    { key: 'primiera', label: t('partita.primiera') },
    { key: 'scope', label: t('partita.scope') },
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
      const current_val = cur[field] || 0
      const newVal = current_val + delta
      if (field === 'napoli') {
        if (current_val === 0 && delta > 0) cur[field] = 3
        else if (newVal < 3) cur[field] = 0
        else cur[field] = Math.min(max, newVal)
      } else {
        cur[field] = Math.min(max, Math.max(0, newVal))
      }
      return { ...c, [pi]: cur }
    })
  }

  function napoliPresoDA(pi) {
    return partita.players.some((_, otherPi) => otherPi !== pi && (current[otherPi]?.napoli || 0) > 0)
  }

  function isTakenByOtherSquadra(si, key) {
    return partita.squadre.some((_, otherSi) => otherSi !== si && !!(current[otherSi]?.[key]))
  }

  function togglePointSquadra(si, key) {
    setCurrent(c => {
      const cur = { ...(c[si] || {}) }
      cur[key] = cur[key] ? 0 : 1
      return { ...c, [si]: cur }
    })
  }

  function changeCounterSquadra(si, field, delta) {
    const max = field === 'napoli' ? 10 : field === 'scope' ? 18 : 999
    setCurrent(c => {
      const cur = { ...(c[si] || {}) }
      const current_val = cur[field] || 0
      const newVal = current_val + delta
      if (field === 'napoli') {
        if (current_val === 0 && delta > 0) cur[field] = 3
        else if (newVal < 3) cur[field] = 0
        else cur[field] = Math.min(max, newVal)
      } else {
        cur[field] = Math.min(max, Math.max(0, newVal))
      }
      return { ...c, [si]: cur }
    })
  }

  function napoliPresoDaSquadra(si) {
    return partita.squadre.some((_, otherSi) => otherSi !== si && (current[otherSi]?.napoli || 0) > 0)
  }

  async function confirmMano() {
    const obbligatori = ['settebello', ...(opzioni.rebello ? ['rebello'] : [])]

    if (isSquadre) {
      for (const key of obbligatori) {
        const assegnato = partita.squadre.some((_, si) => !!(current[si]?.[key]))
        if (!assegnato) {
          setError(t('partita.assegnaSquadra', { punto: key === 'settebello' ? t('partita.setteBello') : t('partita.reBello') }))
          return
        }
      }
    } else {
      for (const key of obbligatori) {
        const assegnato = partita.players.some((_, pi) => !!(current[pi]?.[key]))
        if (!assegnato) {
          setError(t('partita.assegna', { punto: key === 'settebello' ? t('partita.setteBello') : t('partita.reBello') }))
          return
        }
      }
    }

    if (navigator.vibrate) navigator.vibrate(50)
    setError('')

    const mano = {}

    if (isSquadre) {
      partita.squadre.forEach((_, si) => {
        const cur = current[si] || {}
        const total = puntiAttivi.reduce((s, pt) => s + (cur[pt.key] || 0), 0)
          + (cur.scope || 0)
          + (opzioni.napoli !== false ? (cur.napoli || 0) : 0)
        mano[si] = { ...cur, total }
      })
    } else {
      partita.players.forEach((_, pi) => {
        const cur = current[pi] || {}
        const total = puntiAttivi.reduce((s, pt) => s + (cur[pt.key] || 0), 0)
          + (cur.scope || 0)
          + (opzioni.napoli !== false ? (cur.napoli || 0) : 0)
        mano[pi] = { ...cur, total }
      })
    }

    const nuoveMani = [...mani, mano]

    let conclusa = false
    if (isSquadre) {
      const nuoviScores = calcTotalsSquadre(partita.squadre, nuoveMani).map(t => t.total)
      const nuovoMax = Math.max(...nuoviScores)
      conclusa = nuovoMax >= partita.target && nuoviScores.filter(s => s === nuovoMax).length === 1
    } else {
      const nuoviScores = calcTotals(partita.players, nuoveMani).map(t => t.total)
      const nuovoMax = Math.max(...nuoviScores)
      conclusa = nuovoMax >= partita.target && nuoviScores.filter(s => s === nuovoMax).length === 1
    }

    if (isGuest) {
      updatePartitaLocale({ mani: nuoveMani, conclusa })
      if (conclusa) {
        setShowVittoria(true)
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#c9963a', '#e8b84b', '#f5f0e8', '#4caf6e'] })
        if (isSquadre) {
          const nuoviTotals = calcTotalsSquadre(partita.squadre, nuoveMani).map(t => t.total)
          const winnerSi = nuoviTotals.indexOf(Math.max(...nuoviTotals))
          const mySquadra = getMySquadra(partita.squadre, user, partita.createdBy)
          playSound(mySquadra === winnerSi ? 'vittoria' : 'sconfitta')
        } else {
          const nuoviTotals = calcTotals(partita.players, nuoveMani).map(t => t.total)
          const nuovoWinnerIdx = nuoviTotals.indexOf(Math.max(...nuoviTotals))
          const myIdx = getMyIdx(partita.players, user, partita.createdBy)
          playSound(myIdx === nuovoWinnerIdx ? 'vittoria' : 'sconfitta')
        }
      }
    } else {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ mani: nuoveMani }))
      setPartita(prev => ({ ...prev, mani: nuoveMani, conclusa }))
      if (conclusa) {
        localStorage.removeItem(LOCAL_KEY)
        await updateDoc(doc(db, 'partite', id), { mani: nuoveMani, conclusa: true, conclusaAt: serverTimestamp() })
        setShowVittoria(true)
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#c9963a', '#e8b84b', '#f5f0e8', '#4caf6e'] })
        if (isSquadre) {
          const nuoviTotals = calcTotalsSquadre(partita.squadre, nuoveMani).map(t => t.total)
          const winnerSi = nuoviTotals.indexOf(Math.max(...nuoviTotals))
          const mySquadra = getMySquadra(partita.squadre, user, partita.createdBy)
          playSound(mySquadra === winnerSi ? 'vittoria' : 'sconfitta')
        } else {
          const nuoviTotals = calcTotals(partita.players, nuoveMani).map(t => t.total)
          const nuovoWinnerIdx = nuoviTotals.indexOf(Math.max(...nuoviTotals))
          const myIdx = getMyIdx(partita.players, user, partita.createdBy)
          playSound(myIdx === nuovoWinnerIdx ? 'vittoria' : 'sconfitta')
        }
      }
    }

    setCurrent({})
    setTab('punteggio')
  }

  async function deleteMano(mi) {
    const nuoveMani = mani.filter((_, i) => i !== mi)
    if (isGuest) {
      updatePartitaLocale({ mani: nuoveMani, conclusa: false })
    } else {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ mani: nuoveMani }))
      setPartita(prev => ({ ...prev, mani: nuoveMani, conclusa: false }))
    }
    setDeletingMano(null)
  }

  async function resetPartita() {
    if (isGuest) {
      updatePartitaLocale({ mani: [], conclusa: false })
    } else {
      localStorage.removeItem(LOCAL_KEY)
      setPartita(prev => ({ ...prev, mani: [], conclusa: false }))
    }
    setCurrent({})
    setShowReset(false)
  }

  const nomeVincitore = isSquadre
    ? partita.squadre[winnerSquadraIdx]?.nome
    : partita.players[winnerIdx]?.name
  const riepilogoVincitore = isSquadre
    ? scoresSquadre.map((s, i) => `${partita.squadre[i].nome}: ${s}`).join(' · ')
    : scores.map((s, i) => `${partita.players[i].name}: ${s}`).join(' · ')
  const hasAnyWinner = isSquadre ? winnerSquadraIdx !== -1 : winnerIdx !== -1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 'var(--safe-top)' }}>

      {error && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
          <div style={modalText}>{error}</div>
          <button onClick={() => setError('')} style={{ ...btnConfirm, padding: '12px 32px' }}>{t('comune.ok')}</button>
        </Modal>
      )}

      {showReset && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🃏</div>
          <div style={modalText}>{t('partita.resettare')}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowReset(false)} style={btnCancel}>{t('comune.annulla')}</button>
            <button onClick={resetPartita} style={btnConfirm}>{t('partita.reset')}</button>
          </div>
        </Modal>
      )}

      {showVittoria && partita.conclusa && hasAnyWinner && (
        <Modal>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)', marginBottom: '8px' }}>
            {t('partita.haVinto', { nome: nomeVincitore })}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {riepilogoVincitore}
          </div>
          {isGuest && (
            <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '16px', padding: '10px', background: 'rgba(201,150,58,0.1)', borderRadius: 'var(--radius-md)' }}>
              {t('partita.ospiteBanner')}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setShowVittoria(false); navigate('/') }} style={btnCancel}>{t('partita.home')}</button>
            <button onClick={() => { setShowVittoria(false); navigate(isGuest ? '/login' : '/nuova-partita') }} style={btnConfirm}>
              {isGuest ? t('partita.registrati') : t('partita.nuovaPartita')}
            </button>
          </div>
        </Modal>
      )}

      {deletingMano !== null && (
        <Modal>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
          <div style={modalText}>{t('partita.eliminaMano', { n: deletingMano + 1 })}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setDeletingMano(null)} style={btnCancel}>{t('comune.annulla')}</button>
            <button onClick={() => deleteMano(deletingMano)} style={btnConfirm}>{t('partita.elimina')}</button>
          </div>
        </Modal>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--ink-muted)', flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--cream)' }}>
          {partita.conclusa ? t('partita.conclusa') : t('partita.mano', { n: mani.length + 1 })}
        </span>
        <button onClick={() => setShowReset(true)} style={backBtn}>↺</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--ink-muted)', flexShrink: 0 }}>
        {['punteggio', ...(partita.conclusa ? [] : ['mano']), 'storico'].map(tab2 => (
          <button key={tab2} onClick={() => setTab(tab2)} style={{
            flex: 1, padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === tab2 ? 'var(--gold)' : 'transparent'}`,
            color: tab === tab2 ? 'var(--gold)' : 'var(--text-faint)',
            fontSize: '12px', fontWeight: '500', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '-1px'
          }}>
            {tab2 === 'punteggio' ? t('partita.punteggio') : tab2 === 'mano' ? t('partita.nuovaMano') : t('partita.storico')}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px calc(16px + var(--safe-bottom))' }}>

        {tab === 'punteggio' && (
          <>
            {isSquadre ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {partita.squadre.map((squadra, si) => {
                  const tot = totalsSquadre[si]
                  const isWinner = winnerSquadraIdx === si
                  const pct = Math.min(100, Math.round((tot.total / partita.target) * 100))
                  return (
                    <div key={si} style={{
                      background: 'var(--ink-soft)',
                      border: `${isWinner ? '2px' : '1px'} solid ${isWinner ? 'var(--gold)' : 'var(--ink-muted)'}`,
                      borderRadius: 'var(--radius-lg)', padding: '16px', position: 'relative', overflow: 'hidden'
                    }}>
                      {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }} />}
                      {isWinner && <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--ink)', fontSize: '10px', fontWeight: '500', padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.05em' }}>{t('partita.vincitore')}</span>}
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--cream)', marginBottom: '4px' }}>{squadra.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '8px' }}>
                        {squadra.players.map(p => p.name).join(' · ')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: isWinner ? 'var(--gold)' : 'var(--cream)', lineHeight: 1 }}>{tot.total}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>/ {partita.target}</span>
                      </div>
                      <div style={{ height: '3px', background: 'var(--ink-muted)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'var(--success)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {pills.map(pill => (
                          <div key={pill.key} style={{ background: 'var(--ink-muted)', borderRadius: '20px', padding: '3px 9px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
                            {pill.label} <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{tot[pill.key] || 0}</b>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: partita.players.length > 2 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
                {partita.players.map((p, pi) => {
                  const tot = totals[pi]
                  const isWinner = winnerIdx === pi
                  const pct = Math.min(100, Math.round((tot.total / partita.target) * 100))
                  return (
                    <div key={pi} style={{
                      background: 'var(--ink-soft)',
                      border: `${isWinner ? '2px' : '1px'} solid ${isWinner ? 'var(--gold)' : 'var(--ink-muted)'}`,
                      borderRadius: 'var(--radius-lg)', padding: '16px', position: 'relative', overflow: 'hidden'
                    }}>
                      {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }} />}
                      {isWinner && <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--ink)', fontSize: '10px', fontWeight: '500', padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.05em' }}>{t('partita.vincitore')}</span>}
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--cream)', marginBottom: '8px' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: isWinner ? 'var(--gold)' : 'var(--cream)', lineHeight: 1 }}>{tot.total}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>/ {partita.target}</span>
                      </div>
                      <div style={{ height: '3px', background: 'var(--ink-muted)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'var(--success)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {pills.map(pill => (
                          <div key={pill.key} style={{ background: 'var(--ink-muted)', borderRadius: '20px', padding: '3px 9px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
                            {pill.label} <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{tot[pill.key] || 0}</b>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {!partita.conclusa && (
              <button className="btn-gold" onClick={() => setTab('mano')}>{t('partita.registraMano')}</button>
            )}
          </>
        )}

        {tab === 'mano' && (
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--cream)' }}>{t('partita.mano', { n: mani.length + 1 })}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{t('partita.selezionaPunti')}</span>
            </div>

            {isSquadre ? (
              partita.squadre.map((squadra, si) => {
                const cur = current[si] || {}
                return (
                  <div key={si} style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink-muted)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{squadra.nome}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '12px' }}>{squadra.players.map(p => p.name).join(' · ')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      {puntiAttivi.map(pt => {
                        const on = !!cur[pt.key]
                        const disabled = !on && isTakenByOtherSquadra(si, pt.key)
                        return (
                          <button key={pt.key} onClick={() => !disabled && togglePointSquadra(si, pt.key)} disabled={disabled} style={{
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
                            {labelMap[pt.key] || pt.label}
                          </button>
                        )
                      })}
                    </div>
                    {counterFields.map(field => {
                      const isNapoli = field === 'napoli'
                      const napoliBloccato = isNapoli && napoliPresoDaSquadra(si)
                      return (
                        <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', opacity: napoliBloccato ? 0.3 : 1 }}>
                          <div>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {field === 'scope' ? t('partita.scope') : 'Napoli'}
                            </span>
                            {isNapoli && <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '6px' }}>{t('partita.napoliMin')}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <button onClick={() => !napoliBloccato && changeCounterSquadra(si, field, -1)} style={stepBtn} disabled={napoliBloccato}>−</button>
                            <span style={{ width: '38px', textAlign: 'center', fontSize: '15px', fontWeight: '500', color: 'var(--cream)', borderLeft: '1px solid var(--ink-soft)', borderRight: '1px solid var(--ink-soft)', lineHeight: '38px' }}>{cur[field] || 0}</span>
                            <button onClick={() => !napoliBloccato && changeCounterSquadra(si, field, 1)} style={stepBtn} disabled={napoliBloccato}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            ) : (
              partita.players.map((p, pi) => {
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
                            {labelMap[pt.key] || pt.label}
                          </button>
                        )
                      })}
                    </div>
                    {counterFields.map(field => {
                      const isNapoli = field === 'napoli'
                      const napoliBloccato = isNapoli && napoliPresoDA(pi)
                      return (
                        <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', opacity: napoliBloccato ? 0.3 : 1 }}>
                          <div>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {field === 'scope' ? t('partita.scope') : 'Napoli'}
                            </span>
                            {isNapoli && <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '6px' }}>{t('partita.napoliMin')}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <button onClick={() => !napoliBloccato && changeCounter(pi, field, -1)} style={stepBtn} disabled={napoliBloccato}>−</button>
                            <span style={{ width: '38px', textAlign: 'center', fontSize: '15px', fontWeight: '500', color: 'var(--cream)', borderLeft: '1px solid var(--ink-soft)', borderRight: '1px solid var(--ink-soft)', lineHeight: '38px' }}>{cur[field] || 0}</span>
                            <button onClick={() => !napoliBloccato && changeCounter(pi, field, 1)} style={stepBtn} disabled={napoliBloccato}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}

            <button className="btn-gold" onClick={confirmMano} style={{ borderRadius: 0, borderTop: '1px solid var(--ink-muted)' }}>
              {t('partita.confermaMano', { n: mani.length + 1 })}
            </button>
          </div>
        )}

        {tab === 'storico' && (
          mani.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                <DenariLogo size={48} glow={false} />
              </div>
              <p style={{ color: 'var(--text-muted)' }}>{t('partita.nessunaManora')}</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--ink-muted)' }}>
                {t('partita.maniGiocate')}
              </div>
              {[...mani].reverse().map((m, rmi) => {
                const mi = mani.length - 1 - rmi
                return (
                  <div key={mi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: rmi < mani.length - 1 ? '1px solid var(--ink-muted)' : 'none', fontSize: '14px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--cream)', minWidth: '60px' }}>{t('partita.mano', { n: mi + 1 })}</span>
                    <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)', fontSize: '13px', flex: 1, flexWrap: 'wrap' }}>
                      {isSquadre
                        ? partita.squadre.map((s, si) => (
                          <span key={si}>{s.nome}: <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{m[si]?.total || 0}</b></span>
                        ))
                        : partita.players.map((p, pi) => (
                          <span key={pi}>{p.name}: <b style={{ color: 'var(--cream)', fontWeight: '500' }}>{m[pi]?.total || 0}</b></span>
                        ))
                      }
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
      <div style={{ background: 'var(--ink-soft)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '28px 24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
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