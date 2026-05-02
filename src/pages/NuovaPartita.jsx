import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_TARGET } from '../config'
import { savePartitaLocale, generateId } from '../localDB'
import { useTranslation } from 'react-i18next'

export default function NuovaPartita({ user, isGuest }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [modalita, setModalita] = useState(null)
  const [players, setPlayers] = useState([
    { name: isGuest ? '' : (user?.displayName || user?.email?.split('@')[0] || ''), uid: isGuest ? null : user?.uid },
    { name: '', uid: null },
  ])
  const [squadre, setSquadre] = useState([
    { players: [{ name: isGuest ? '' : (user?.displayName || user?.email?.split('@')[0] || ''), uid: isGuest ? null : user?.uid }, { name: '', uid: null }] },
    { players: [{ name: '', uid: null }, { name: '', uid: null }] },
  ])
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [opzioni, setOpzioni] = useState({ rebello: true, napoli: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amici, setAmici] = useState([])
  const [showAmiciPicker, setShowAmiciPicker] = useState(null)

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

  function updateSquadraPlayer(si, pi, val) {
    setSquadre(sq => sq.map((s, sIdx) => sIdx === si ? {
      ...s, players: s.players.map((p, pIdx) => pIdx === pi ? { ...p, name: val, uid: null } : p)
    } : s))
  }

  function selectAmicoSquadra(si, pi, amico) {
    setSquadre(sq => sq.map((s, sIdx) => sIdx === si ? {
      ...s, players: s.players.map((p, pIdx) => pIdx === pi ? { name: amico.displayName, uid: amico.uid } : p)
    } : s))
    setShowAmiciPicker(null)
  }

  function addPlayerToSquadra(si) {
    setSquadre(sq => sq.map((s, sIdx) => sIdx === si && s.players.length < 3 ? {
      ...s, players: [...s.players, { name: '', uid: null }]
    } : s))
  }

  function removePlayerFromSquadra(si, pi) {
    setSquadre(sq => sq.map((s, sIdx) => sIdx === si && s.players.length > 2 ? {
      ...s, players: s.players.filter((_, pIdx) => pIdx !== pi)
    } : s))
  }

  async function startGame() {
    if (modalita === 'classica') {
      if (players.some(p => !p.name.trim())) {
        setError(t('nuovaPartita.erroreNomi'))
        return
      }
      setLoading(true)
      try {
        if (isGuest) {
          const partita = {
            id: generateId(),
            modalita: 'classica',
            players: players.map(p => ({ name: p.name.trim() })),
            target, opzioni, mani: [], conclusa: false,
            createdAt: new Date().toISOString(),
          }
          savePartitaLocale(partita)
          navigate(`/partita/${partita.id}`)
        } else {
          const uids = [user.uid, ...players.slice(1).filter(p => p.uid).map(p => p.uid)]
          const ref = await addDoc(collection(db, 'partite'), {
            modalita: 'classica',
            players: players.map(p => ({ name: p.name.trim(), uid: p.uid || null })),
            uids, target, opzioni, mani: [], conclusa: false,
            createdAt: serverTimestamp(), createdBy: user.uid,
          })
          navigate(`/partita/${ref.id}`)
        }
      } catch (e) {
        setError(t('nuovaPartita.erroreCreazione'))
        setLoading(false)
      }
    } else {
      const tuttiPlayers = squadre.flatMap(s => s.players)
      if (tuttiPlayers.some(p => !p.name.trim())) {
        setError(t('nuovaPartita.erroreNomi'))
        return
      }
      setLoading(true)
      try {
        const squadreConNome = squadre.map(s => ({
          nome: s.players.map(p => p.name.trim()).join(' & '),
          players: s.players.map(p => ({ name: p.name.trim(), uid: p.uid || null }))
        }))
        const uids = tuttiPlayers.filter(p => p.uid).map(p => p.uid)
        if (!isGuest && !uids.includes(user.uid)) uids.unshift(user.uid)

        if (isGuest) {
          const partita = {
            id: generateId(),
            modalita: 'squadre',
            squadre: squadreConNome,
            players: tuttiPlayers.map(p => ({ name: p.name.trim() })),
            target, opzioni, mani: [], conclusa: false,
            createdAt: new Date().toISOString(),
          }
          savePartitaLocale(partita)
          navigate(`/partita/${partita.id}`)
        } else {
          const ref = await addDoc(collection(db, 'partite'), {
            modalita: 'squadre',
            squadre: squadreConNome,
            players: tuttiPlayers.map(p => ({ name: p.name.trim(), uid: p.uid || null })),
            uids, target, opzioni, mani: [], conclusa: false,
            createdAt: serverTimestamp(), createdBy: user.uid,
          })
          navigate(`/partita/${ref.id}`)
        }
      } catch (e) {
        setError(t('nuovaPartita.erroreCreazione'))
        setLoading(false)
      }
    }
  }

  const amiciSelezionati = modalita === 'classica'
    ? players.map(p => p.uid).filter(Boolean)
    : squadre.flatMap(s => s.players).map(p => p.uid).filter(Boolean)

  return (
    <div className="page">

      {/* Modale selezione modalità */}
      {!modalita && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--ink-soft)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '28px 24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--cream)', marginBottom: '8px' }}>{t('nuovaPartita.titolo')}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>{t('nuovaPartita.scegliModalita')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setModalita('classica')} style={{
                padding: '16px', background: 'var(--ink-muted)', border: '1px solid var(--ink-muted)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ fontSize: '15px', color: 'var(--cream)', fontWeight: '500', marginBottom: '4px' }}>🃏 {t('nuovaPartita.classica')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{t('nuovaPartita.classicoDesc')}</div>
              </button>
              <button onClick={() => setModalita('squadre')} style={{
                padding: '16px', background: 'var(--ink-muted)', border: '1px solid var(--ink-muted)',
                borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ fontSize: '15px', color: 'var(--cream)', fontWeight: '500', marginBottom: '4px' }}>👥 {t('nuovaPartita.squadre')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{t('nuovaPartita.squadreDesc')}</div>
              </button>
            </div>
            <button onClick={() => navigate('/')} style={{ ...btnCancel, marginTop: '16px', width: '100%' }}>{t('nuovaPartita.annulla')}</button>
          </div>
        </div>
      )}

      {/* Picker amici */}
      {showAmiciPicker !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--ink-soft)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '24px', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--cream)', marginBottom: '16px' }}>
              {t('nuovaPartita.selezionaAmico')}
            </div>
            {amici.filter(a => !amiciSelezionati.includes(a.uid)).map(a => (
              <div key={a.uid} onClick={() => {
                if (modalita === 'classica') {
                  selectAmico(showAmiciPicker.i, a)
                } else {
                  selectAmicoSquadra(showAmiciPicker.si, showAmiciPicker.pi, a)
                }
              }} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--ink-muted)', border: '1px solid transparent',
                marginBottom: '8px', cursor: 'pointer'
              }}>
<div style={{
  width: '36px', height: '36px', borderRadius: '50%',
  background: 'var(--ink-soft)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontSize: '15px', color: 'var(--gold)', fontFamily: 'var(--font-display)',
  overflow: 'hidden', flexShrink: 0
}}>
  {a.photoURL
    ? <img src={a.photoURL} alt={a.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : a.displayName?.[0]?.toUpperCase()
  }
</div>
                <div>
                  <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{a.displayName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{a.email}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowAmiciPicker(null)} style={btnCancel}>{t('nuovaPartita.annulla')}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>{t('nuovaPartita.titolo')}</h1>
      </div>

      {/* MODALITÀ CLASSICA */}
      {modalita === 'classica' && (
        <>
          <div style={sectionTitle}>{t('nuovaPartita.giocatori')}</div>
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
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{t('nuovaPartita.amico')}</div>
                    </div>
                    <button onClick={() => setShowAmiciPicker({ i })} style={{
                      background: 'none', border: '1px solid var(--ink-muted)',
                      borderRadius: 'var(--radius-md)', padding: '4px 10px',
                      color: 'var(--text-faint)', fontSize: '12px'
                    }}>{t('nuovaPartita.cambia')}</button>
                  </div>
                ) : i === 0 && !isGuest ? (
                  <span style={{ flex: 1, fontSize: '15px', color: 'var(--cream)' }}>{p.name}</span>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      value={p.name}
                      onChange={e => updateName(i, e.target.value)}
                      placeholder={`${t('nuovaPartita.giocatori')} ${i + 1}`}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: '15px' }}
                    />
                    {!isGuest && amici.length > 0 && (
                      <button onClick={() => setShowAmiciPicker({ i })} style={{
                        background: 'none', border: '1px solid var(--ink-muted)',
                        borderRadius: 'var(--radius-md)', padding: '4px 10px',
                        color: 'var(--gold)', fontSize: '12px', flexShrink: 0
                      }}>👥</button>
                    )}
                  </div>
                )}
                {players.length > 2 && i > 0 && (
                  <button onClick={() => removePlayer(i)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '18px', padding: '4px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
          {players.length < 6 && (
            <button className="btn-ghost" onClick={addPlayer} style={{ marginBottom: '24px' }}>
              {t('nuovaPartita.aggiungiGiocatore')}
            </button>
          )}
        </>
      )}

      {/* MODALITÀ SQUADRE */}
      {modalita === 'squadre' && (
        <>
          {squadre.map((squadra, si) => (
            <div key={si} style={{ marginBottom: '20px' }}>
              <div style={sectionTitle}>{t('nuovaPartita.squadra', { n: si + 1 })}</div>
              <div className="card">
                {squadra.players.map((p, pi) => (
                  <div key={pi} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px',
                    borderBottom: pi < squadra.players.length - 1 ? '1px solid var(--ink-muted)' : 'none'
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--ink-muted)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0
                    }}>
                      {pi + 1}
                    </div>
                    {p.uid && p.uid !== user?.uid ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '15px', color: 'var(--cream)' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{t('nuovaPartita.amico')}</div>
                        </div>
                        <button onClick={() => setShowAmiciPicker({ si, pi })} style={{
                          background: 'none', border: '1px solid var(--ink-muted)',
                          borderRadius: 'var(--radius-md)', padding: '4px 10px',
                          color: 'var(--text-faint)', fontSize: '12px'
                        }}>{t('nuovaPartita.cambia')}</button>
                      </div>
                    ) : si === 0 && pi === 0 && !isGuest ? (
                      <span style={{ flex: 1, fontSize: '15px', color: 'var(--cream)' }}>{p.name}</span>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          value={p.name}
                          onChange={e => updateSquadraPlayer(si, pi, e.target.value)}
                          placeholder={`${t('nuovaPartita.giocatori')} ${pi + 1}`}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: '15px' }}
                        />
                        {!isGuest && amici.length > 0 && (
                          <button onClick={() => setShowAmiciPicker({ si, pi })} style={{
                            background: 'none', border: '1px solid var(--ink-muted)',
                            borderRadius: 'var(--radius-md)', padding: '4px 10px',
                            color: 'var(--gold)', fontSize: '12px', flexShrink: 0
                          }}>👥</button>
                        )}
                      </div>
                    )}
                    {squadra.players.length > 2 && !(si === 0 && pi === 0) && (
                      <button onClick={() => removePlayerFromSquadra(si, pi)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '18px', padding: '4px' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              {squadra.players.length < 3 && (
                <button className="btn-ghost" onClick={() => addPlayerToSquadra(si)} style={{ marginTop: '10px' }}>
                  {t('nuovaPartita.aggiungiGiocatore')}
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {/* Punti per vincere */}
      {modalita && (
        <>
          <div style={sectionTitle}>{t('nuovaPartita.puntiPerVincere')}</div>
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>{t('nuovaPartita.target')}</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ink-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button onClick={() => setTarget(t => Math.max(5, t - 1))} style={stepBtn}>−</button>
                <span style={{ width: '48px', textAlign: 'center', fontSize: '16px', fontWeight: '500', color: 'var(--cream)' }}>{target}</span>
                <button onClick={() => setTarget(t => t + 1)} style={stepBtn}>+</button>
              </div>
            </div>
          </div>

          <div style={sectionTitle}>{t('nuovaPartita.variante')}</div>
          <div className="card" style={{ marginBottom: '28px' }}>
            {[
              { key: 'rebello', label: t('nuovaPartita.rebello'), desc: t('nuovaPartita.rebelloDesc') },
              { key: 'napoli', label: t('nuovaPartita.napoli'), desc: t('nuovaPartita.napoliDesc') },
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
                <div onClick={() => setOpzioni(o => ({ ...o, [opt.key]: !o[opt.key] }))} style={{
                  width: '44px', height: '26px', borderRadius: '13px',
                  background: opzioni[opt.key] ? 'var(--gold)' : 'var(--ink-muted)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                }}>
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
            {loading ? '...' : t('nuovaPartita.inizia')}
          </button>
        </>
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

const stepBtn = {
  width: '40px', height: '38px', background: 'none', border: 'none',
  color: 'var(--cream)', fontSize: '20px', display: 'flex',
  alignItems: 'center', justifyContent: 'center'
}

const btnConfirm = { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #c9963a, #e8b84b)', border: 'none', borderRadius: '10px', color: '#1a1a2e', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }
const btnCancel = { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #3d3d58', borderRadius: '10px', color: '#9b95a8', fontSize: '13px', cursor: 'pointer' }