# ScopaScore 🃏

Segnapunti digitale per il gioco di carte italiano **Scopa**. Disponibile su Android, iOS e Web.

---

## Stack Tecnico

| Layer | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Mobile | Capacitor 8 |
| Backend | Firebase (Auth + Firestore + Storage) |
| Piano Firebase | Blaze — region `europe-west1` |
| Deploy Web | Vercel — [scopa-score.vercel.app](https://scopa-score.vercel.app) |
| Build iOS | Codemagic (Mac mini M2) |

---

## Stato Attuale

- **Android** — Live su Google Play Store (package: `com.giacomo.scopascore`), versione 2.8.0 (versionCode 42)
- **iOS** — Build funzionante su Codemagic, non ancora pubblicata (in attesa di account Apple Developer)
- **Web** — [scopa-score.vercel.app](https://scopa-score.vercel.app)

---

## Funzionalità

- Login Google e email/password (Facebook pronto, commentato in attesa verifica Meta)
- Modalità classica e squadre, 2–6 giocatori
- Target automatico per numero di giocatori: 2→11, 3→16, 4+/squadre→21 (salvato in localStorage)
- Varianti **Re bello** e **Napoli**, disattivate di default (salvate in localStorage)
- Multilingua: 🇮🇹 IT, 🇬🇧 EN, 🇪🇸 ES, 🇫🇷 FR, 🇩🇪 DE
- Notifiche locali giornaliere multilingua (Android: Kotlin nativo, iOS: plugin Capacitor)
- Notifiche push FCM (Android)
- Profilo utente con statistiche, foto profilo, tema dark/verde
- Classifica, amici, storico partite
- Offline banner, splash screen animata con suono ad ogni avvio, suoni nativi
- Privacy Policy, Termini di Servizio ed Eliminazione Account ospitati su GitHub Pages

---

## Struttura File Principali

```
src/
├── App.jsx               # Routing, notifiche iOS, back button Android, splash screen
├── config.js             # PUNTI e calcTotals
├── firebase.js           # Firestore con persistenza offline
├── localDB.js            # Partite ospiti in localStorage
├── utils/
│   └── audio.js          # initAudio(), playSound() via NativeAudio
├── components/
│   ├── SplashScreen.jsx  # Splash screen animata con suono apertura (ad ogni avvio)
│   ├── DenariLogo.jsx    # Logo SVG personalizzato
│   └── OfflineBanner.jsx # Banner connessione assente
└── pages/
    ├── Login.jsx
    ├── Home.jsx
    ├── NuovaPartita.jsx  # Creazione partita con target/opzioni persistenti
    ├── Partita.jsx       # Schermata di gioco
    ├── Profilo.jsx       # Profilo utente e statistiche
    ├── Amici.jsx
    ├── Classifica.jsx
    ├── Onboarding.jsx
    ├── Consenso.jsx
    └── Legal.jsx         # Privacy Policy e Termini multilingua (5 lingue)
android/
  app/src/main/java/com/giacomo/scopascore/
    ├── MainActivity.kt           # Kotlin: canali notifica, permessi, scheduling
    └── NotificationReceiver.kt   # Kotlin: mostra notifica, rischedula per domani
ios/
codemagic.yaml                    # Pipeline build iOS
index.html                        # Privacy Policy / Termini (GitHub Pages)
```

---

## Flusso di Sviluppo — Android

### 1. Build e sync

```bash
npm run build
npx cap sync android
```

### 2. Build firmata

Apri il progetto in **Android Studio**, poi:

`Build → Generate Signed Bundle / APK → Android App Bundle`

Seleziona il keystore, compila le credenziali e genera il bundle `.aab`.

### 3. Versioning

Prima di ogni release, aggiorna in `android/app/build.gradle`:

```groovy
versionCode 42          // incrementa di 1 ad ogni upload
versionName "2.8.0"     // segue semver
```

### 4. Pubblicazione

Carica il bundle `.aab` su **Google Play Console**:

`Produzione → Crea nuova release → Carica bundle`

---

## Flusso di Sviluppo — iOS

La build iOS avviene tramite **Codemagic** (Mac mini M2).

### Configurazione Codemagic

- `codemagic.yaml` nella root del progetto
- Podfile generato dinamicamente nello script yaml
- `GoogleService-Info.plist` iniettato via variabile d'ambiente base64 (gruppo `secrets`)
- Icone e splash screen configurate
- `Info.plist` con permessi e Google Sign-In URL scheme

### Manca (in attesa)

- Account Apple Developer (99$/anno)
- Certificati di firma (Distribution Certificate + Provisioning Profile)
- APNs per notifiche push iOS

### Build

Push sul branch configurato in Codemagic → build automatica → `.ipa` scaricabile.

---

## Flusso di Sviluppo — Web

```bash
npm run build
```

Il deploy su Vercel avviene automaticamente ad ogni push su `main`.

---

## Firebase

- **Auth**: Google Sign-In, email/password
- **Firestore**: dati utenti, partite, amici, classifiche
- **Storage**: foto profilo
- **Persistenza offline** abilitata in `firebase.js`
- **Regola costi**: scrittura su Firestore solo a fine partita (non ad ogni mano)

---

## Audio

I suoni sono gestiti tramite `@capacitor-community/native-audio` (solo su piattaforme native).

| Asset ID | File | Quando |
|---|---|---|
| `apertura` | `apertura.mp3` | Splash screen ad ogni avvio |
| `vittoria` | `vittoria.mp3` | Fine partita — vittoria |
| `sconfitta` | `sconfitta.mp3` | Fine partita — sconfitta |
| `notifica` | `notifica.mp3` | Ricezione notifica locale |

---

## Notifiche

### Locali giornaliere — Android (Kotlin nativo)

Le notifiche Android sono gestite interamente in Kotlin, bypassando `@capacitor/local-notifications` per evitare crash su MIUI/Xiaomi.

- `MainActivity.kt` — richiede permesso `POST_NOTIFICATIONS` (Android 13+) e chiama `scheduleDailyNotification()`
- `NotificationReceiver.kt` — mostra la notifica alle 12:00 e rischedula per il giorno successivo tramite `AlarmManager.setExactAndAllowWhileIdle`
- La lingua viene salvata da React via `@capacitor/preferences` con chiave `appLang` e letta da Kotlin in `CapacitorStorage`
- Canale Android: `promemoria`

### Locali giornaliere — iOS

Gestite via `@capacitor/local-notifications` in `App.jsx`, schedulate alle 12:00 con ripetizione giornaliera.

### Push (FCM)

- Solo Android (iOS in attesa APNs)
- Token FCM salvato su Firestore al login

---

## Pagina Legale

Privacy Policy, Termini di Servizio ed Eliminazione Account sono ospitati su GitHub Pages:

**[gtarraran992.github.io/scopa-score](https://gtarraran992.github.io/scopa-score)**

Il file `index.html` si trova nella root del repo e viene aggiornato direttamente da lì. Contiene:
- Privacy Policy con titolare del trattamento (GDPR) — Giacomo Tarraran
- Termini di Servizio
- Istruzioni eliminazione account (link diretto: `#elimina-account`)

Stessa URL registrata su Google Play Console, Google Cloud Console (OAuth consent screen) e Facebook Developer Console.

---

## Permessi Android (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

---

## File Sensibili (non committare)

```
android/app/google-services.json
android.keystore
.env
```

Tutti già in `.gitignore`. In caso di commit accidentale, ruotare immediatamente le chiavi.

---

## Variabili d'Ambiente

Crea un file `.env` nella root (non committare):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Dipendenze Chiave

```bash
# Capacitor
@capacitor/core@8.3.4
@capacitor/android@8.3.4
@capacitor/ios@8.3.4
@capacitor/local-notifications
@capacitor/push-notifications
@capacitor/preferences
@capacitor/app

# Firebase
@capacitor-firebase/authentication   # Google Sign-In nativo in WebView
firebase

# Audio
@capacitor-community/native-audio

# i18n
i18next
react-i18next
```

---

## Note Tecniche

- `signInWithPopup` e `signInWithRedirect` non funzionano in Capacitor WebView — usare `@capacitor-firebase/authentication`
- Il certificato SHA-1 di Google Play deve essere aggiunto separatamente su Firebase (diverso dal keystore locale)
- Le notifiche su Android usano `setExactAndAllowWhileIdle` per garantire l'esecuzione in Doze mode
- `MainActivity.java` è stato migrato a `MainActivity.kt` (Kotlin)
- La lingua dell'app è salvata con `@capacitor/preferences` (chiave `appLang`) per essere accessibile da Kotlin

---

## Contatti

Sviluppato da **Giacomo Tarraran** — [gtarraran992@gmail.com](mailto:gtarraran992@gmail.com)
