import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { signOut, updateProfile, deleteUser } from 'firebase/auth'
import { calcTotals } from '../config'
import { version } from '../../package.json'
import { useTranslation } from 'react-i18next'

export default function Profilo({ user }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [nome, setNome] = useState(user.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState(null)
  const [storico, setStorico] = useState([])
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('scopa-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'green'
  })
  const [lingua, setLingua] = useState(() => {
    return localStorage.getItem('i18nextLng') || i18n.language || 'it'
  })

  function changeTheme(th) {
    setTheme(th)
    localStorage.setItem('scopa-theme', th)
    document.documentElement.setAttribute('data-theme', th)
  }

  async function changeLingua(lang) {
    setLingua(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), { language: lang })
    }
  }

  useEffect(() => {
    async function loadData() {
      const qConcluse = query(
        collection(db, 'partite'),
        where('uids', 'array-contains', user.uid),
        where('conclusa', '==', true)
      )
      const snapConcluse = await getDocs(qConcluse)
      const partiteConcluse = snapConcluse.docs.map(d => d.data())

      const qTutte = query(
        collection(db, 'partite'),
        where('uids', 'array-contains', user.uid)
      )
      const snapTutte = await getDocs(qTutte)
      const tutteLePartite = snapTutte.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setStorico(tutteLePartite)

      let vinte = 0
      let perse = 0
      const avversariMap = {}

      partiteConcluse.forEach(p => {
        const isSquadre = p.modalita === 'squadre'

        if (isSquadre) {
          const squadre = p.squadre || []
          const scores = squadre.map((_, si) =>
            (p.mani || []).reduce((s, m) => s + (m[si]?.total || 0), 0)
          )
          const maxScore = Math.max(...scores)
          const winnerSi = scores.filter(s => s === maxScore).length === 1
            ? scores.indexOf(maxScore) : -1
          const mySquadra = squadre.findIndex(s => s.players.some(pl => pl.uid === user.uid))
          if (mySquadra === -1) return
          const hoVinto = winnerSi === mySquadra
          if (hoVinto) vinte++
          else perse++
        } else {
          const totals = calcTotals(p.players, p.mani || [])
          const scores = totals.map(t => t.total)
          const maxScore = Math.max(...scores)
          const winnerIdx = scores.filter(s => s === maxScore).length === 1
            ? scores.indexOf(maxScore) : -1
          const myIdx = p.players.findIndex(pl => pl.uid === user.uid)
          const myIdxFallback = myIdx === -1 && p.createdBy === user.uid ? 0 : myIdx
          if (myIdxFallback === -1) return
          const hoVinto = winnerIdx === myIdxFallback
          if (hoVinto) vinte++
          else perse++

          p.players.forEach((pl, pi) => {
            if (pi === myIdxFallback) return
            const key = pl.name.trim().toLowerCase()
            if (!avversariMap[key]) {
              avversariMap[key] = { name: pl.name, partite: 0, vinteContro: 0 }
            }
            avversariMap[key].partite++
            if (hoVinto) avversariMap[key].vinteContro++
          })
        }
      })

      const topAvversari = Object.values(avversariMap)
        .sort((a, b) => b.partite - a.partite)
        .slice(0, 4)

      setStats({ vinte, perse, totale: partiteConcluse.length, topAvversari })
    }

    loadData()
  }, [user.uid])

  async function saveName() {
    if (!nome.trim()) return
    setSaving(true)
    await updateProfile(auth.currentUser, { displayName: nome.trim() })
    await updateDoc(doc(db, 'users', user.uid), { displayName: nome.trim() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function deleteAccount() {
    if (!window.confirm(t('profilo.confermaElimina'))) return
    try {
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(auth.currentUser)
    } catch (e) {
      alert(t('profilo.erroreElimina'))
    }
  }

  const pct = stats?.totale > 0 ? Math.round((stats.vinte / stats.totale) * 100) : 0

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>{t('profilo.titolo')}</h1>
      </div>

      {/* Avatar */}
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

      {/* Nome */}
      <div style={sectionTitle}>{t('profilo.nomeVisualizzato')}</div>
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: '15px' }}
          placeholder={t('profilo.ilTuoNome')}
        />
        <button onClick={saveName} disabled={saving} style={{
          background: saved ? 'var(--success)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          border: 'none', borderRadius: 'var(--radius-md)',
          padding: '8px 16px', color: 'var(--ink)',
          fontSize: '13px', fontWeight: '500', flexShrink: 0, transition: 'background 0.2s'
        }}>
          {saved ? '✓' : saving ? '...' : t('profilo.salva')}
        </button>
      </div>

      {/* Statistiche */}
      <div style={sectionTitle}>{t('profilo.statistiche')}</div>
      {!stats ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-faint)' }}>{t('profilo.caricamento')}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: t('profilo.partite'), value: stats.totale },
              { label: t('profilo.vittorie'), value: stats.vinte },
              { label: t('profilo.sconfitte'), value: stats.perse },
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

          <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('profilo.percentualeVittoria')}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gold)' }}>{pct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--ink-muted)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold), var(--gold-light))', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {stats.topAvversari.length > 0 && (
            <>
              <div style={sectionTitle}>{t('profilo.giocatoriFrequenti')}</div>
              <div className="card" style={{ marginBottom: '24px' }}>
                {stats.topAvversari.map((a, i) => {
                  const pctW = a.partite > 0 ? Math.round((a.vinteContro / a.partite) * 100) : 0
                  return (
                    <div key={i} style={{ padding: '14px 18px', borderBottom: i < stats.topAvversari.length - 1 ? '1px solid var(--ink-muted)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', color: 'var(--cream)' }}>{a.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {a.vinteContro}V / {a.partite - a.vinteContro}S · {a.partite} partite
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--ink-muted)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctW}%`, background: pctW >= 50 ? 'var(--success)' : 'var(--danger)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Storico partite */}
      {storico.length > 0 && (
        <>
          <div style={sectionTitle}>{t('profilo.ultimePArtite')}</div>
          <div className="card" style={{ marginBottom: '24px' }}>
            {storico.slice(0, 10).map((p, i) => {
              const isSquadre = p.modalita === 'squadre'
              let hoVinto = false
              let titolo = ''
              let scores = []

              if (isSquadre) {
                const squadre = p.squadre || []
                scores = squadre.map((_, si) =>
                  (p.mani || []).reduce((s, m) => s + (m[si]?.total || 0), 0)
                )
                const maxScore = Math.max(...scores)
                const winnerSi = p.conclusa && scores.filter(s => s === maxScore).length === 1
                  ? scores.indexOf(maxScore) : -1
                const mySquadra = squadre.findIndex(s => s.players.some(pl => pl.uid === user.uid))
                hoVinto = winnerSi !== -1 && mySquadra === winnerSi
                titolo = squadre.map(s => s.nome).join(' vs ')
              } else {
                const allTotals = calcTotals(p.players, p.mani || [])
                const myIdx = p.players.findIndex(pl => pl.uid === user.uid)
                const myIdxFallback = myIdx === -1 && p.createdBy === user.uid ? 0 : myIdx
                const maxScore = Math.max(...allTotals.map(t => t.total))
                const winnerIdx = p.conclusa && allTotals.filter(t => t.total === maxScore).length === 1
                  ? allTotals.findIndex(t => t.total === maxScore) : -1
                hoVinto = winnerIdx === myIdxFallback
                const playersOrdinati = p.players
                  .map((pl, originalIdx) => ({ ...pl, originalIdx }))
                  .sort((a, b) => (b.uid === user.uid) - (a.uid === user.uid))
                titolo = playersOrdinati.map(pl => pl.name).join(' vs ')
                scores = playersOrdinati.map(pl => allTotals[pl.originalIdx]?.total || 0)
              }

              const data = p.createdAt?.toDate
                ? p.createdAt.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : ''

              return (
                <div key={p.id} style={{
                  padding: '13px 18px',
                  borderBottom: i < Math.min(storico.length, 10) - 1 ? '1px solid var(--ink-muted)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer'
                }} onClick={() => navigate(`/partita/${p.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {!p.conclusa ? '🎮' : hoVinto ? '🏆' : '😔'}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: '500' }}>{titolo}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {data} · {!p.conclusa ? t('profilo.inCorso') : hoVinto ? t('profilo.vittoria') : t('profilo.sconfitta')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {scores.join(' — ')}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Tema */}
      <div style={sectionTitle}>{t('profilo.tema')}</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { id: 'dark', label: t('profilo.dark'), color: '#1a1a2e' },
          { id: 'green', label: t('profilo.tavolo'), color: '#1a3a2a' },
        ].map(th => (
          <button
            key={th.id}
            onClick={() => changeTheme(th.id)}
            style={{
              flex: 1, padding: '14px 10px',
              background: th.color,
              border: `2px solid ${theme === th.id ? 'var(--gold)' : 'var(--ink-muted)'}`,
              borderRadius: 'var(--radius-lg)',
              color: theme === th.id ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: theme === th.id ? '500' : '400',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {th.label}
          </button>
        ))}
      </div>

      {/* Lingua */}
      <div style={sectionTitle}>{t('profilo.lingua')}</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { id: 'it', label: 'Italiano' },
          { id: 'en', label: 'English' },
        ].map(l => (
          <button
            key={l.id}
            onClick={() => changeLingua(l.id)}
            style={{
              flex: 1, padding: '14px 10px',
              background: 'var(--ink-soft)',
              border: `2px solid ${lingua === l.id ? 'var(--gold)' : 'var(--ink-muted)'}`,
              borderRadius: 'var(--radius-lg)',
              color: lingua === l.id ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: lingua === l.id ? '500' : '400',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Legal */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <button className="btn-ghost" onClick={() => navigate('/privacy')} style={{ fontSize: '13px' }}>
          {t('profilo.privacy')}
        </button>
        <button className="btn-ghost" onClick={() => navigate('/termini')} style={{ fontSize: '13px' }}>
          {t('profilo.termini')}
        </button>
      </div>

      {/* Segnala problema */}
      <button
        className="btn-ghost"
        onClick={() => window.open('mailto:gtarraran992@gmail.com?subject=ScopaScore%20Feedback&body=Versione%3A%20' + version)}
        style={{ marginBottom: '12px' }}
      >
        {t('profilo.segnala')}
      </button>

      {/* Logout */}
      <button className="btn-ghost" onClick={() => signOut(auth)} style={{ marginBottom: '12px' }}>
        {t('profilo.esci')}
      </button>

      {/* Elimina account */}
      <button className="btn-ghost" onClick={deleteAccount} style={{ marginBottom: '20px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
        {t('profilo.eliminaAccount')}
      </button>

      {/* Versione */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)', marginBottom: '8px' }}>
        ScopaScore v{version}
      </div>
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