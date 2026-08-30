# ArtAround: Progetto di Tecnologie Web A.A. 25/26
- *Nome gruppo*: Horash
- *Membri del gruppo*: Davide Gamberini, Mattia Graziani, Samuele Grillini
- *Tipo di progetto*: 18 - 33
- *Localizzazione di file e docker*: `/home/web/site252623/html`, gocker attiva il docker composer all'interno della cartella `html` in modo tale che i container partano da essa.

### STRUTTURA DEL PROGETTO
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

## FEATURES
### SICUREZZA 
#### Access Token + Refresh Token (Backend)
  • Access Token (JWT a breve durata).
  • Refresh Token (JWT a lunga durata), salvato in un Cookie HttpOnly (non accessibile da JavaScript lato client).
  • Logout con pulizia del cookie e revoca della sessione.
#### Middleware di Autenticazione e Ruoli (Backend)
  • authenticate JWT in precisi endpoint.
  • authorize Roles per bloccare l'accesso alle risorse a certi ruoli in specifici endpoint.
#### Signup, Login (Backend)
  • registrazione: ruoli controllati, verifica mail per signup con password (password hashata) con invio codice per conferma
  • opzione login con Google OAuth2.0 (senza password)
  • opzione login con password
  • grazie a verifica mail implementato il merge degli account su mail univoca
#### Sessione (Frontend)
  • Interceptor per gestion automatica dell'Access Token su ogni richiesta HTTP
  • Gestione trasparente dell'errore 401 Unauthorized per richiedere automaticamente un nuovo Access Token usando il Refresh Token in Cookie HttpOnly.

### IMMAGINI
#### Upload Immagini
  [Client]
  • Drag and drop e selezione file
  [Server]
  • Multer: middleware che permette di creare un buffer in ram appositamente per i file caricati
  • Imager: controlla estensione del file in input
  • File System: immagine salvata su file system e identificata da un campo nei modelli del db tramite url fs (backend/assets/...)

### NAVIGATOR
#### Archiettura del Navigator
Pianificazione della visita: l'utente ha la possibilità, una volta selezionato il museo di trovare una o più visite, sulla base di diversi parametri.
    - Chi sei (tono): l'utente può selezionare il tono della visita.
    - Quanto tempo hai: restituisce tutte le visite che hanno durata massima del tempo selezionato
    - Interessi: selezione le visita in base alle categorie scelte dall'utente.
    - Opzioni aggiuntive: accessibilità per disabili, visita gratuita.
#### Interazione con l'utente
##### Se interazione vocale
1. Cattura audio: utilizziamo la Web Speech API nativa per catturare il file audio.
2. Multer: crea un buffer in RAM per evitare operazioni I/O su disco.
3. Speech-To-Text: chiamata API che restituisce il testo trascritto.
4. Intenzione dell'utente
> Se l'utente usa form salta i prunti precedenti
5. Sistema di cache: se item già presente in DB no chiamate LLM, altrimenti inviamo richiesta alle API LLM per ottenere la risposta. 
5. bis) Se risposta generata da LLM, salviamo la risposta tra gli item del DB
6. Text-To-Speech: testo tradotto in audio, restituito un file audio.
7. Client: la Web Speech API riceve il file l'audio e lo riproduce.

### GRUPPI
- Sviluppata tramite Angular.
- Possibilità solo a utenti amministratori o professori di creare gruppi. Per accedere alla stanza condiviso un codice univoco dal professore (richiesto login per accedere alla stanza).
- Visita di gruppo controllata dal docente, lascaita libertà di approfondimento e modifica impostazioni agli studenti.


### MARKETPLACE
#### Architettura
- È stato sviluppato tramite web-components e Vanilla JS.
- L'integrazione di marketplace con i web-components permette di utilizzare le funzionalità del router di Angular e di avere un'unica SPA (Single Page Application) senza ricaricare la pagina. Questo viene fatto tramite l'uso di un componente Angular che funge da wrapper per i web-components, consentendo la gestione della navigazione e delle interazioni all'interno dell'applicazione Angular e tramite il componente Vanilla Router che seleziona il contenuto corretto
#### Funzionalità
- Dal marketplace è possibile esplorare tutte le visite tramite filtri e barra di ricerca, cliccando su una visita o su un museo si viene reindirizzati alla pagina di dettaglio del museo o della visita.
- Dal marketplace è possibile anche creare una visita, selezionando il museo e gli item da inserire nella visita. Una volta creata la visita, questa viene salvata nel database e resa disponibile per la navigazione.

### VISITE
#### Architettura
- Sviluppate tramite web-components e Vanilla JS.
- La pagina di creazione delle visite implementa funzionalità di drag and drop per selezionare gli item da inserire nella visita. Le opere possono essere selezionate da una lista resa disponibile dal museo, allegati di una descrizione di default.È possibile aggiungere descrizioni personalizzate per ogni opera selezionata e ulteriori dettagli sull'opera. La pagina permette di aggiungere ulteriori informazioni sulla visita (es costo, durata, licenza...).
#### Funzionalità
- Tre pagine principali: 
    - Pagina di ricerca delle visite: permette di filtrare le visite in base a diversi parametri, come il museo, la durata, gli interessi e le opzioni aggiuntive.
    - Pagina di dettaglio della visita: mostra le informazioni della visita selezionata, gli item e la durata.
    - Pagina di creazione della visita: permette di creare una visita selezionando il museo e gli item da inserire nella visita.


## ORGANIZZAZIONE DEL LAVORO
Ci siamo inizialmente divisi l'organizzazione delle due macro componenti del progetto, frontend e backend. Nelle fasi successive del progetto la divisione è diventata sempre meno netta interagento tra le due parti. 
Divisione iniziale del del progetto:
- Frontend - Samuele Grillini
- Backend - Davide Gamberini e Mattia Graziani
Disione singolare delle parti del progetto:
- HomePage - Samuele Grillini
- Marketplace (pagina principale) - Samuele Grillini
- Marketplace (creazione visita) - Tutti
- Visite - Tutti
- Navigator - Mattia Graziani + Samuele Grillini
- Gruppi - Mattia Graziani
- Login - Tutti
- Immagini - Davide Gamberini
### Uso LLM
- Per la generazione di contenuti delle visite
- Assistenza nel coding: inizialmente abbiamo generato molto codice tramite LLM, ma successivamente abbiamo deciso di ricominciare il lavoro da zero per avere un codice più pulito e comprensibile. Quindi LLM è stato utile per dare un'indea su cosa scrivere, di fatto una documentazione di supporto. Sulla parte conlusiva del progetto, vista la fretta, per piccole modifiche su codice già strutturato abbiamo usato LLM.



# !ATTENZIONE!
Gli utenti di base inseriti nel database hanno password 12345678 come richiesto e nome utente autore1-2/visitatore1-2, ma per gestione del login è richiesta mail+password per accedere. Abbiamo semplicemente aggiunto il suffisso @artaround.it ai relativi utenti. Esempio d'accesso autore1:
    - email: autore1@artaround.it
    - password: 12345678
