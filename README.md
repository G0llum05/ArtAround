# ArtAround
Progetto Tecnologie Web A.A. 2025/26

## Swagger API Backend

**swagger-autogen** è un tool che permette di generare automaticamente la documentazione Swagger per le API RESTful basate su Node.js e Express. Questo strumento analizza il codice sorgente dell'applicazione e genera un file di specifica Swagger (in formato JSON o YAML) che descrive le API disponibili, i loro endpoint, i parametri, le risposte e altri dettagli rilevanti.
- Per allineare i nuovi endpoint con la documentazione Swagger, è necessario eseguire il comando `npm run swagger` ogni volta che vengono aggiunti o modificati gli endpoint dell'API. Questo comando rigenererà automaticamente il file di specifica Swagger, garantendo che la documentazione sia sempre aggiornata e coerente con l'implementazione effettiva delle API.

**generatore CLI** per setuppare una nuova root api e generare automaticamente la documentazione Swagger per le API RESTful basate su Node.js e Express. Questo strumento analizza il codice sorgente dell'applicazione e genera un file di specifica Swagger (in formato JSON o YAML) che descrive le API disponibili, i loro endpoint, i parametri, le risposte e altri dettagli rilevanti.
- Usare il comando `npm run create:module <Nome>` per creare un nuovo modulo API. Questo comando genererà automaticamente la struttura di base del modulo, inclusi i file necessari per la gestione degli endpoint e la documentazione Swagger associata.


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
  #### 📌 Modulo 1: Hashing, Gestione Token & Protezione API (Backend)

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
      /api/auth/register.
      • Header HTTP di Sicurezza (helmet): Attivazione di protezioni avanzate per evitare Clickjacking, MIME-sniffing e XSS.
      • Validazione & Sanitizzazione Input (express-validator): Controllo rigoroso delle password (lunghezza, caratteri),
      email e ruoli inviati nel body.

  ──────
  #### 📌 Modulo 2: Flussi Utente (Signup, Login, Profilo & OAuth)

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
  #### 📌 Modulo 3: Integrazione lato Frontend (Angular / Web App)

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
