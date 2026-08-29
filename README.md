# ArtAround: Progetto di Tecnologie Web A.A. 25/26
- *Nome gruppo*: Horash
- *Membri del gruppo*: Davide Gamberini, Mattia Graziani, Samuele Grillini
- *Tipo di progetto*: 18 - 33
- *Localizzazione di file e docker*: `/home/web/site252623/html`, gocker attiva il docker composer all'interno della cartella `html` in modo tale che i container partano da essa.
.
├── backend
│   ├── assets -> immagini
│   │   └── seed
│   │       ├── artists
│   │       └── museums
│   ├── config -> file di configurazione al setup dell'app
│   ├── controller
│   │   ├── artist
│   │   ├── artwork
│   │   ├── auth
│   │   ├── groupvisit
│   │   ├── item
│   │   ├── museum
│   │   ├── navigator
│   │   ├── role
│   │   ├── upload
│   │   ├── user
│   │   └── visit
│   ├── data
│   │   ├── mapper
│   │   ├── model -> Modelli di dati che definiscono un'entità nel DB mongo.
│   │   │   ├── dto
│   │   │   ├── schemas -> Sotto-schemi che definiscono strutture dati complesse riutilizzabili.
│   │   └── seed
│   ├── Dockerfile
│   ├── middleware
│   ├── package.json
│   ├── scripts -> script di appoggio per test
│   ├── server.js
│   ├── service
│   ├── socket
│   ├── swagger-output.json
│   └── utils
├── docker-compose.yaml
├── frontend
│   ├── angular.json
│   ├── Dockerfile
│   ├── package.json
│   ├── proxy.conf.json
│   ├── public
│   │   ├── assets
│   │   │   ├── icons
│   │   │   └── images
│   │   └── marketplace -> vanilla (web-components) (web-components)
│   │       ├── components -> componenti vanilla
│   │       ├── marketplace.registry.css
│   │       ├── marketplace.registry.js -> file di appoggio per includere i web-components all'interno di angular
│   │       ├── pages -> pagine vanilla
│   │       ├── router.js
│   │       └── services -> servizi vanilla
│   ├── README.md
│   ├── src -> Angular APP
│   │   ├── app
│   │   │   ├── components -> sotto-components angular
│   │   │   ├── interceptors
│   │   │   ├── models
│   │   │   ├── pages -> pagine angular
│   │   │   ├── pipes -> funzioni oer l'utilizzo di operatori `|`
│   │   │   └── services -> servizi che richiamano le API rest definite nel backend
│   │   ├── environments -> variabili d'ambiente di angular
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   └── tsconfig.spec.json
├── package.json

- *Features rilevanti*


## SECURITY
### 🛡️ Architettura di Sicurezza & Autenticazione

    flowchart TD
        subgraph Client ["Frontend (Angular / Web)"]
            UI[Login / Signup Form] --> AuthSvc[Auth Service / State]
            AuthSvc --> Interceptor[HTTP Auth Interceptor]
            Interceptor --> Guards[AuthGuard & RoleGuard]
        end
    
        subgraph Security ["Security & Auth Layer"]
            RateLimit[Rate Limiter & Helmet] --> Valid[Input Validation & Sanitization]
            Valid --> Passport[Passport Local & OAuth2 Strategy]
        end
    
        subgraph Backend ["Backend API & Controllers"]
            Passport --> JWT[JWT / HttpOnly Refresh Token Engine]
            JWT --> RBAC[RBAC Middleware: Roles & Permissions]
            RBAC --> Controllers[Protected Controllers]
        end
    
        Client --> Security
    ──────
  #### Modulo 1: Hashing, Gestione Token & Protezione API (Backend)

  1. Strategia di Gestione Sessioni (Access Token + Refresh Token in Cookie HttpOnly):
      • Access Token (JWT a breve durata, es. 15 min): Inviato nell'header Authorization: Bearer <token> per autenticare le
      chiamate API.
      • Refresh Token (JWT a lunga durata, es. 7 giorni): Salvato in un Cookie HttpOnly, SameSite=Strict, Secure (non
      accessibile da JavaScript lato client, immune ad attacchi XSS).
      • Logout & Invalidazione Sessione: Endpoint /api/auth/logout per la pulizia del cookie e la revoca della sessione.
  2. Middleware di Autenticazione & Ruoli (RBAC - Role-Based Access Control):
      • authenticateJWT: Middleware che verifica l'Access Token su tutte le rotte riservate.
      • authorizeRoles('admin', 'museumstaff', 'teacher'): Middleware configurabile che blocca l'accesso alle risorse a
      seconda del ruolo dell'utente.
  3. Hardening della Sicurezza (Prevenzione Attacchi):
      • Rate Limiting (express-rate-limit): Protezione da attacchi Brute Force sugli endpoint /api/auth/login e
      /api/auth/signup.
      • Header HTTP di Sicurezza (helmet): Attivazione di protezioni avanzate per evitare Clickjacking, MIME-sniffing e XSS.
      • Validazione & Sanitizzazione Input (express-validator): Controllo rigoroso delle password (lunghezza, caratteri),
      email e ruoli inviati nel body.

  ──────
  #### Modulo 2: Flussi Utente (Signup, Login, Profilo & OAuth)

  1. Registrazione (Signup):
      • Assegnazione controllata dei ruoli (gli utenti standard si registrano come guest o student; l'elevazione a
      museumstaff o teacher richiede approvazione/invito).
  2. Endpoint Me & Gestione Profilo:
      • Endpoint /api/auth/me: Restituisce le informazioni sanificate dell'utente attualmente autenticato via
      UserResponseDTO.
      • Endpoint /api/auth/preferences: Consente all'utente di aggiornare le sue preferenze (lingua, notifiche, esigenze
      particolari).
  3. Perfezionamento OAuth (Google):
      • Reindirizzamento sicuro al client dopo la login tramite token/cookie anziché passare il token visibile nei parametri
      della query string.

  ──────
  #### Modulo 3: Integrazione lato Frontend (Angular / Web App)

  1. Auth Service & Reattività:
      • Gestione dello stato dell'utente autenticato tramite RxJS BehaviorSubject o Angular Signal (currentUser, isLoggedIn,
      userRole).
  2. HTTP Interceptor:
      • Iniezione automatica dell'Access Token su ogni richiesta HTTP.
      • Gestione trasparente dell'errore 401 Unauthorized per richiedere automaticamente un nuovo Access Token usando il
      Refresh Token in Cookie HttpOnly.
  3. Guardie di Navigazione (Route Guards):
      • AuthGuard: Protegge le rotte riservate reindirizzando al login gli utenti non autenticati.
      • RoleGuard: Protegge le sezioni riservate ai singoli ruoli (es. dashboard musei per museumstaff).
  ### Modulo 4: Mail Checker
    Utilizziamo un servizio per invio di mail di conferma improntato all'unficazione di utenti al login. Per vincoli amministrativi della macchina di laboratorio, non funziona. Ma se avessimo accesso al pannello di controllo del DNS potremmo abilitarlo e ottenere un livello di sicurezza ulteriore.
    DNS Records
    Domain Verification
    DKIM
    Type    Name    Content    TTL    Status
    TXT    resend._domainkey.site252623.tw.cs    p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDu+wQuxt6/2IyR6JvKqcVnSt2YwoOTG9pG6Tmrv62I1xpY78jU+AAYtb5d4dmENTP2DBCvS/4ks1iZkwqRhV7j9OpibDMt6sy5f471S/6PGd6v6azMR4I96HQc7k5+PgQR8RGl6qLlaXegdGn3cFehDvDc4jtacLeDKq0yhEbO8wIDAQAB    Auto    not started
    Enable Sending
    SPF
    Type    Name    Content    TTL    Priority    Status
    MX    send.site252623.tw.cs    feedback-smtp.eu-west-1.amazonses.com    Auto    10    not started
    TXT    send.site252623.tw.cs    v=spf1 include:amazonses.com ~all    Auto        not started
  ──────
  ## UPLOAD
  ### Architettura di Upload di Immagini
  [Client]
  1. Uppy.js: mostra una maschera di caricamento tramite drag and drop e seleziona file
  2. Invio dei file caricat tramite form-data
  [Server]
  1. Multer: middleware che permette di creare un buffer in ram appositamente per i file caricati, utilizzato per evitare operazione di I/O sul disco della VM, rendendo il processo molto più rapido.
  2. Controllo del tipo di Upload:
    - Museum-Related Upload: il file viene salvato all'interno della cartella `assets/museums/` seguendo il percorso corretto per ciascuna sotto categoria quale `artists`, `artwork`, `museum`, `visit`.
    - Profile picture Upload: il file viene salvato nella cartella `assets/users/:userId` 
  3. Imager: controlla l'estensione del file in input:
    - Se Immagine raster: la converto tramite il middleware sharp nel formato webp, compresso e molto più leggero da salvare nel database.
    - Se Immagine vettoriale: la mantengo nel suo formato originale.
  4. File System: l'immagine viene restituita come risposta tramite un servizio di URL resolution.

## NAVIGATOR
### Archiettura del Navigator
0. Pianificazione della visita: l'utente ha la possibilità, una volta selezionato il museo di trovare una o più visite, sulla base di diversi parametri.
    - Chi sei (tono): l'utente può selezionare il tono della visita.
    - Quanto tempo hai: restituisce tutte le visite che hanno durata massima del tempo selezionato
    - Interessi: selezione le visita in base alle categorie scelte dall'utente.
    - Opzioni aggiuntive: accessibilità per disabili, visita gratuita.
1. Interazione con l'utente
    - Interazione guidata: utilizzo di bottoni con domande standardizzate per permettere una rapida interazione manuale
    - Interazione vocale: utilizziamo un'architettura STT -> RequestParser -> [LLMRequest] -> TTS per fornire una risposta quanto più funzionale alle richieste dell'utente
### Archiettura vocale
1. Cattura audio: utilizziamo la Web Speech API nativa per catturare il file audio in formato `.wav`.
2. Multer: crea un buffer in RAM per evitare operazioni I/O su disco.
3. Speech-To-Text: chiamata API a GroqSTT che restituisce il testo trascritto.
4. Parsing della risposta: partendo dal testo trascritto [...]
5. Text-To-Speech: mandiamo una richiesta alla ResponsiveVoiceAPI che restituisce un file audio `.wav`.
6. Client: la Web Speech API risceve in input il file trascritto e riproduce l'audio in automatico.
