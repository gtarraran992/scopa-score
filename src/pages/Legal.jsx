import { useNavigate } from 'react-router-dom'

export default function Legal({ page }) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/profilo')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>
          {page === 'privacy' ? 'Privacy Policy' : 'Termini di Servizio'}
        </h1>
      </div>

      {page === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Ultimo aggiornamento: Aprile 2026</p>

      <h2 style={h2}>1. Introduzione</h2>
      <p>ScopaScore ("noi", "nostra", "app") rispetta la tua privacy. Questa Privacy Policy descrive come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali.</p>

      <h2 style={h2}>2. Dati raccolti</h2>
      <p>Raccogliamo i seguenti dati:</p>
      <ul style={ulStyle}>
        <li>Email e nome visualizzato (tramite registrazione o login Google)</li>
        <li>Dati delle partite (punteggi, giocatori, date)</li>
        <li>Lista amici aggiunti nell'app</li>
      </ul>

      <h2 style={h2}>3. Utilizzo dei dati</h2>
      <p>I dati vengono utilizzati esclusivamente per:</p>
      <ul style={ulStyle}>
        <li>Fornire le funzionalità dell'app (partite, classifiche, statistiche)</li>
        <li>Identificare l'utente all'interno dell'app</li>
        <li>Mostrare le statistiche di gioco</li>
      </ul>

      <h2 style={h2}>4. Condivisione dei dati</h2>
      <p>Non vendiamo né condividiamo i tuoi dati con terze parti. I dati sono archiviati su Firebase (Google) con sede nell'Unione Europea.</p>

      <h2 style={h2}>5. Conservazione dei dati</h2>
      <p>I tuoi dati vengono conservati finché il tuo account è attivo. Puoi eliminare il tuo account in qualsiasi momento dalla pagina Profilo.</p>

      <h2 style={h2}>6. Diritti dell'utente</h2>
      <p>Hai il diritto di accedere, modificare ed eliminare i tuoi dati personali. Per qualsiasi richiesta contattaci a: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>

      <h2 style={h2}>7. Contatti</h2>
      <p>Per domande sulla privacy: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function TermsOfService() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Ultimo aggiornamento: Aprile 2026</p>

      <h2 style={h2}>1. Accettazione dei termini</h2>
      <p>Utilizzando ScopaScore accetti i presenti Termini di Servizio. Se non li accetti, ti preghiamo di non utilizzare l'app.</p>

      <h2 style={h2}>2. Descrizione del servizio</h2>
      <p>ScopaScore è un'app gratuita per il conteggio dei punti nel gioco di carte Scopa. Permette di tracciare partite, visualizzare statistiche e confrontarsi con gli amici.</p>

      <h2 style={h2}>3. Account utente</h2>
      <p>Per utilizzare ScopaScore è necessario creare un account. Sei responsabile della sicurezza delle tue credenziali di accesso.</p>

      <h2 style={h2}>4. Comportamento dell'utente</h2>
      <p>Ti impegni a non utilizzare l'app per scopi illeciti o per danneggiare altri utenti.</p>

      <h2 style={h2}>5. Limitazione di responsabilità</h2>
      <p>ScopaScore è fornita "così com'è". Non garantiamo la disponibilità continua del servizio e non siamo responsabili per eventuali perdite di dati.</p>

      <h2 style={h2}>6. Modifiche ai termini</h2>
      <p>Ci riserviamo il diritto di modificare questi termini. Le modifiche saranno comunicate tramite aggiornamento dell'app.</p>

      <h2 style={h2}>7. Contatti</h2>
      <p>Per domande: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

const backBtn = {
  background: 'var(--ink-soft)', border: '1px solid var(--ink-muted)',
  borderRadius: 'var(--radius-md)', padding: '8px 14px',
  fontSize: '16px', color: 'var(--cream)'
}

const textStyle = {
  fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8,
  display: 'flex', flexDirection: 'column', gap: '12px'
}

const h2 = {
  fontFamily: 'var(--font-display)', fontSize: '16px',
  color: 'var(--cream)', marginTop: '8px'
}

const ulStyle = { paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }

const dateStyle = { fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' }