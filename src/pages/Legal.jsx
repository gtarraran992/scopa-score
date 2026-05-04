import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Legal({ page }) {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'it'

  const title = page === 'privacy' ? 'Privacy Policy' : {
    it: 'Termini di Servizio',
    en: 'Terms of Service',
    es: 'Términos de Servicio',
    fr: "Conditions d'utilisation",
    de: 'Nutzungsbedingungen',
  }[lang] || 'Termini di Servizio'

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/profilo')} style={backBtn}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)' }}>
          {title}
        </h1>
      </div>

      {page === 'privacy' ? (
        lang === 'en' ? <PrivacyPolicyEN /> :
        lang === 'es' ? <PrivacyPolicyES /> :
        lang === 'fr' ? <PrivacyPolicyFR /> :
        lang === 'de' ? <PrivacyPolicyDE /> :
        <PrivacyPolicyIT />
      ) : (
        lang === 'en' ? <TermsOfServiceEN /> :
        lang === 'es' ? <TermsOfServiceES /> :
        lang === 'fr' ? <TermsOfServiceFR /> :
        lang === 'de' ? <TermsOfServiceDE /> :
        <TermsOfServiceIT />
      )}
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

function PrivacyPolicyES() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Última actualización: abril de 2026</p>
      <h2 style={h2}>1. Introducción</h2>
      <p>ScopaScore ("nosotros", "nuestra", "app") respeta tu privacidad. Esta Política de privacidad describe cómo recopilamos, usamos y protegemos tu información personal.</p>
      <h2 style={h2}>2. Datos recopilados</h2>
      <p>Recopilamos los siguientes datos:</p>
      <ul style={ulStyle}>
        <li>Email y nombre visible (mediante registro o inicio de sesión con Google)</li>
        <li>Datos de partidas (puntuaciones, jugadores, fechas)</li>
        <li>Lista de amigos añadidos en la app</li>
      </ul>
      <h2 style={h2}>3. Uso de los datos</h2>
      <p>Los datos se usan exclusivamente para:</p>
      <ul style={ulStyle}>
        <li>Proporcionar las funciones de la app (partidas, clasificaciones, estadísticas)</li>
        <li>Identificar al usuario dentro de la app</li>
        <li>Mostrar las estadísticas de juego</li>
      </ul>
      <h2 style={h2}>4. Compartición de datos</h2>
      <p>No vendemos ni compartimos tus datos con terceros. Los datos se almacenan en Firebase (Google) dentro de la Unión Europea.</p>
      <h2 style={h2}>5. Conservación de datos</h2>
      <p>Tus datos se conservan mientras tu cuenta esté activa. Puedes eliminar tu cuenta en cualquier momento desde la página de Perfil.</p>
      <h2 style={h2}>6. Derechos del usuario</h2>
      <p>Tienes derecho a acceder, modificar y eliminar tus datos personales. Para cualquier solicitud contáctanos en: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
      <h2 style={h2}>7. Contacto</h2>
      <p>Para preguntas sobre privacidad: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function PrivacyPolicyFR() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Dernière mise à jour : avril 2026</p>
      <h2 style={h2}>1. Introduction</h2>
      <p>ScopaScore ("nous", "notre", "app") respecte ta vie privée. Cette Politique de confidentialité décrit comment nous collectons, utilisons et protégeons tes informations personnelles.</p>
      <h2 style={h2}>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul style={ulStyle}>
        <li>Email et nom affiché (via inscription ou connexion Google)</li>
        <li>Données des parties (scores, joueurs, dates)</li>
        <li>Liste d'amis ajoutés dans l'app</li>
      </ul>
      <h2 style={h2}>3. Utilisation des données</h2>
      <p>Les données sont utilisées exclusivement pour :</p>
      <ul style={ulStyle}>
        <li>Fournir les fonctionnalités de l'app (parties, classements, statistiques)</li>
        <li>Identifier l'utilisateur au sein de l'app</li>
        <li>Afficher les statistiques de jeu</li>
      </ul>
      <h2 style={h2}>4. Partage des données</h2>
      <p>Nous ne vendons ni ne partageons tes données avec des tiers. Les données sont stockées sur Firebase (Google) au sein de l'Union Européenne.</p>
      <h2 style={h2}>5. Conservation des données</h2>
      <p>Tes données sont conservées tant que ton compte est actif. Tu peux supprimer ton compte à tout moment depuis la page Profil.</p>
      <h2 style={h2}>6. Droits de l'utilisateur</h2>
      <p>Tu as le droit d'accéder, de modifier et de supprimer tes données personnelles. Pour toute demande contacte-nous à : <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
      <h2 style={h2}>7. Contact</h2>
      <p>Pour les questions relatives à la confidentialité : <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function PrivacyPolicyDE() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Letzte Aktualisierung: April 2026</p>
      <h2 style={h2}>1. Einleitung</h2>
      <p>ScopaScore ("wir", "unser", "App") respektiert deine Privatsphäre. Diese Datenschutzrichtlinie beschreibt, wie wir deine persönlichen Daten erheben, verwenden und schützen.</p>
      <h2 style={h2}>2. Erhobene Daten</h2>
      <p>Wir erheben folgende Daten:</p>
      <ul style={ulStyle}>
        <li>E-Mail und Anzeigename (über Registrierung oder Google-Anmeldung)</li>
        <li>Spieldaten (Punkte, Spieler, Daten)</li>
        <li>Liste der in der App hinzugefügten Freunde</li>
      </ul>
      <h2 style={h2}>3. Verwendung der Daten</h2>
      <p>Die Daten werden ausschließlich verwendet für:</p>
      <ul style={ulStyle}>
        <li>Bereitstellung der App-Funktionen (Spiele, Ranglisten, Statistiken)</li>
        <li>Identifizierung des Nutzers innerhalb der App</li>
        <li>Anzeige von Spielstatistiken</li>
      </ul>
      <h2 style={h2}>4. Datenweitergabe</h2>
      <p>Wir verkaufen oder teilen deine Daten nicht mit Dritten. Die Daten werden auf Firebase (Google) innerhalb der Europäischen Union gespeichert.</p>
      <h2 style={h2}>5. Datenspeicherung</h2>
      <p>Deine Daten werden gespeichert, solange dein Konto aktiv ist. Du kannst dein Konto jederzeit über die Profilseite löschen.</p>
      <h2 style={h2}>6. Nutzerrechte</h2>
      <p>Du hast das Recht, auf deine persönlichen Daten zuzugreifen, sie zu ändern und zu löschen. Für Anfragen kontaktiere uns unter: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
      <h2 style={h2}>7. Kontakt</h2>
      <p>Bei Datenschutzfragen: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
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

function TermsOfServiceES() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Última actualización: abril de 2026</p>
      <h2 style={h2}>1. Aceptación de los términos</h2>
      <p>Al usar ScopaScore aceptas estos Términos de Servicio. Si no los aceptas, te pedimos que no uses la app.</p>
      <h2 style={h2}>2. Descripción del servicio</h2>
      <p>ScopaScore es una app gratuita para contar los puntos en el juego de cartas Scopa. Permite registrar partidas, ver estadísticas y competir con amigos.</p>
      <h2 style={h2}>3. Cuenta de usuario</h2>
      <p>Para usar ScopaScore es necesario crear una cuenta. Eres responsable de la seguridad de tus credenciales de acceso.</p>
      <h2 style={h2}>4. Comportamiento del usuario</h2>
      <p>Te comprometes a no usar la app para fines ilícitos o para perjudicar a otros usuarios.</p>
      <h2 style={h2}>5. Limitación de responsabilidad</h2>
      <p>ScopaScore se proporciona "tal cual". No garantizamos la disponibilidad continua del servicio y no somos responsables de ninguna pérdida de datos.</p>
      <h2 style={h2}>6. Cambios en los términos</h2>
      <p>Nos reservamos el derecho de modificar estos términos. Los cambios se comunicarán mediante actualizaciones de la app.</p>
      <h2 style={h2}>7. Contacto</h2>
      <p>Para preguntas: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function TermsOfServiceFR() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Dernière mise à jour : avril 2026</p>
      <h2 style={h2}>1. Acceptation des conditions</h2>
      <p>En utilisant ScopaScore tu acceptes ces Conditions d'utilisation. Si tu ne les acceptes pas, merci de ne pas utiliser l'app.</p>
      <h2 style={h2}>2. Description du service</h2>
      <p>ScopaScore est une app gratuite pour compter les points dans le jeu de cartes Scopa. Elle permet de suivre les parties, de voir les statistiques et de se mesurer à ses amis.</p>
      <h2 style={h2}>3. Compte utilisateur</h2>
      <p>Pour utiliser ScopaScore tu dois créer un compte. Tu es responsable de la sécurité de tes identifiants de connexion.</p>
      <h2 style={h2}>4. Comportement de l'utilisateur</h2>
      <p>Tu t'engages à ne pas utiliser l'app à des fins illicites ou pour nuire à d'autres utilisateurs.</p>
      <h2 style={h2}>5. Limitation de responsabilité</h2>
      <p>ScopaScore est fournie "telle quelle". Nous ne garantissons pas la disponibilité continue du service et ne sommes pas responsables de toute perte de données.</p>
      <h2 style={h2}>6. Modifications des conditions</h2>
      <p>Nous nous réservons le droit de modifier ces conditions. Les modifications seront communiquées via les mises à jour de l'app.</p>
      <h2 style={h2}>7. Contact</h2>
      <p>Pour toute question : <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
    </div>
  )
}

function TermsOfServiceDE() {
  return (
    <div style={textStyle}>
      <p style={dateStyle}>Letzte Aktualisierung: April 2026</p>
      <h2 style={h2}>1. Annahme der Bedingungen</h2>
      <p>Durch die Nutzung von ScopaScore akzeptierst du diese Nutzungsbedingungen. Wenn du sie nicht akzeptierst, bitte nutze die App nicht.</p>
      <h2 style={h2}>2. Beschreibung des Dienstes</h2>
      <p>ScopaScore ist eine kostenlose App zum Zählen der Punkte im Kartenspiel Scopa. Sie ermöglicht es, Spiele zu verfolgen, Statistiken einzusehen und sich mit Freunden zu messen.</p>
      <h2 style={h2}>3. Benutzerkonto</h2>
      <p>Um ScopaScore zu nutzen, musst du ein Konto erstellen. Du bist für die Sicherheit deiner Anmeldedaten verantwortlich.</p>
      <h2 style={h2}>4. Nutzerverhalten</h2>
      <p>Du verpflichtest dich, die App nicht für illegale Zwecke oder zur Schädigung anderer Nutzer zu verwenden.</p>
      <h2 style={h2}>5. Haftungsbeschränkung</h2>
      <p>ScopaScore wird "wie besehen" bereitgestellt. Wir garantieren keine kontinuierliche Verfügbarkeit des Dienstes und haften nicht für Datenverluste.</p>
      <h2 style={h2}>6. Änderungen der Bedingungen</h2>
      <p>Wir behalten uns das Recht vor, diese Bedingungen zu ändern. Änderungen werden durch App-Updates mitgeteilt.</p>
      <h2 style={h2}>7. Kontakt</h2>
      <p>Bei Fragen: <a href="mailto:gtarraran992@gmail.com" style={{ color: 'var(--gold)' }}>gtarraran992@gmail.com</a></p>
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