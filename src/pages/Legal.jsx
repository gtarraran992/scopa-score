import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Legal({ page }) {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/profilo')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>
          {page === 'privacy'
            ? (isEn ? 'Privacy Policy' : 'Privacy Policy')
            : (isEn ? 'Terms of Service' : 'Termini di Servizio')}
        </h1>
      </div>

      {page === 'privacy'
        ? (isEn ? <PrivacyPolicyEN /> : <PrivacyPolicyIT />)
        : (isEn ? <TermsOfServiceEN /> : <TermsOfServiceIT />)
      }
    </div>
  )
}

function PrivacyPolicyIT() {
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

function PrivacyPolicyEN() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Last updated: April 2026</p>
      <h2 style={h2}>1. Introduction</h2>
      <p>ScopaScore ("we", "our", "app") respects your privacy. This Privacy Policy describes how we collect, use and protect your personal information.</p>
      <h2 style={h2}>2. Data collected</h2>
      <p>We collect the following data:</p>
      <ul style={ulStyle}>
        <li>Email and display name (via registration or Google login)</li>
        <li>Game data (scores, players, dates)</li>
        <li>Friends list added in the app</li>
      </ul>
      <h2 style={h2}>3. Use of data</h2>
      <p>Data is used exclusively to:</p>
      <ul style={ulStyle}>
        <li>Provide app features (games, leaderboards, statistics)</li>
        <li>Identify the user within the app</li>
        <li>Display game statistics</li>
      </ul>
      <h2 style={h2}>4. Data sharing</h2>
      <p>We do not sell or share your data with third parties. Data is stored on Firebase (Google) within the European Union.</p>
      <h2 style={h2}>5. Data retention</h2>
      <p>Your data is retained as long as your account is active. You can delete your account at any time from the Profile page.</p>
      <h2 style={h2}>6. User rights</h2>
      <p>You have the right to access, modify and delete your personal data. For any request contact us at: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
      <h2 style={h2}>7. Contact</h2>
      <p>For privacy questions: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function TermsOfServiceIT() {
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

function TermsOfServiceEN() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Last updated: April 2026</p>
      <h2 style={h2}>1. Acceptance of terms</h2>
      <p>By using ScopaScore you accept these Terms of Service. If you do not accept them, please do not use the app.</p>
      <h2 style={h2}>2. Service description</h2>
      <p>ScopaScore is a free app for scoring the Scopa card game. It allows you to track games, view statistics and compete with friends.</p>
      <h2 style={h2}>3. User account</h2>
      <p>To use ScopaScore you need to create an account. You are responsible for the security of your login credentials.</p>
      <h2 style={h2}>4. User conduct</h2>
      <p>You agree not to use the app for unlawful purposes or to harm other users.</p>
      <h2 style={h2}>5. Limitation of liability</h2>
      <p>ScopaScore is provided "as is". We do not guarantee continuous availability of the service and are not responsible for any data loss.</p>
      <h2 style={h2}>6. Changes to terms</h2>
      <p>We reserve the right to modify these terms. Changes will be communicated through app updates.</p>
      <h2 style={h2}>7. Contact</h2>
      <p>For questions: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
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