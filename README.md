# Insegnamento di Tecnologie Web
# CdS In Informatica   
# (A.A. 2025-26)

# Progetto ArtAround 18-33

## Nome gruppo
Horash

## Membri del gruppo
- Nome e cognome: `Davide Gamberini` matricola: `0001163129`, mail: `davide.gamberini7@studio.unibo.it` 
- Nome e cognome: `Mattia Graziani` matricola: `0001160010`, mail: `mattia.graziani3@studio.unibo.it` 
- Nome e cognome: `Samuele Grillini` matricola: `0001161555`, mail: `samuele.grillini@studio.unibo.it` 
- LLM: Gemini 3.7 flash (Antigravity) licenza proprietaria, ottenuto con abbonamento da 1 anno gratuito per studenti delle Università.
## Tipo di progetto
18 - 33

## Data di disponibilità delle applicazioni
15 settembre

## Locazione del progetto:
* URI del Marketplace: https://site252623.tw.cs.unibo.it/marketplace
* URI del Navigator: https://site252623.tw.cs.unibo.it/navigator?visitId=[visitId]&museumId=[museumId]
* URI Home: https://site252623.tw.cs.unibo.it/
* URI Ricerca della visita: https://site252623.tw.cs.unibo.it/marketplace/visit/search
* URI Creazione della visita: https://site252623.tw.cs.unibo.it/marketplace/visit/create
* URI Accesso al Gruppo Visita: https://site252623.tw.cs.unibo.it/groups
* URI Login: https://site252623.tw.cs.unibo.it/login

## Organizzazione dei sorgenti
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

---

## Tecnologie utilizzate
Abbiamo utilizzato Vanilla JS con Node e Express per il backend, mentre per il frontend abbiamo utilizzato Vanilla JS(Web components) + HTML + CSS per la parte di Marketplace e Visite, mentre per la restante parte abbiamo utilizzato Angular.
Abbiamo voluto mantenere un unica SPA e per fare ciò ci siamo serviti di un file registry e un componente fittizio Angular per richiamare tutta la parte di Marketplace includendo anche le visite, questo permette di rendere trasparente all'utente il cambio di tecnologia.

**Frontend**
- @zxing/library@0.21.3
- @zxing/ngx-scanner@21.0.0
- @uppy/core@5.2.0
- @uppy/dashboard@5.1.1
- @uppy/drag-drop@5.1.0
- @uppy/xhr-upload@5.2.0
- uppy@5.2.4

**Backend**
- @responsivevoice/api-client@2.0.5
- bcryptjs@3.0.3
- cookie-parser@1.4.7
- cors@2.8.6
- dotenv@17.3.1
- express-rate-limit@8.6.2
- express@5.2.1
- fs-extra@11.4.0
- groq-sdk@1.5.0
- helmet@8.3.0
- jsonwebtoken@9.0.3
- mongoose@9.2.2
- multer@1.4.5-lts.2
- nodemailer@9.0.5
- passport-google-oauth20@2.0.0
- passport-jwt@4.0.1
- passport-local@1.0.0
- passport@0.7.0
- resend@6.19.0
- sharp@0.33.5
- socket.io@4.8.3
- swagger-autogen@2.23.7
- swagger-ui-express@5.0.1

---

### Applicazione navigator
#### Autenticazione - Sessione
- Interceptor per gestione automatica dell'Access Token su ogni richiesta HTTP
- Gestione trasparente dell'errore 401 Unauthorized per richiedere automaticamente un nuovo Access Token usando il Refresh Token in Cookie HttpOnly.

#### Upload Immagini
- Drag and drop e selezione file

#### Archiettura del Navigator
Pianificazione della visita: l'utente ha la possibilità, una volta selezionato il museo di trovare una o più visite, sulla base di diversi parametri.
- Chi sei (tono): l'utente può selezionare il tono della visita.
- Quanto tempo hai: restituisce tutte le visite che hanno durata massima del tempo selezionato
- Interessi: selezione le visita in base alle categorie scelte dall'utente.
- Opzioni aggiuntive: accessibilità per disabili, visita gratuita.
##### Interazione con l'utente
1. Cattura audio: utilizziamo la Web Speech API nativa per catturare il file audio.
2. Multer: crea un buffer in RAM per evitare operazioni I/O su disco.
3. Speech-To-Text: chiamata API che restituisce il testo trascritto.
4. Intenzione dell'utente
> Se l'utente usa form salta i prunti precedenti
5. Sistema di cache: se item già presente in DB no chiamate LLM, altrimenti inviamo richiesta alle API LLM per ottenere la risposta.
5. bis). Se risposta generata da LLM, salviamo la risposta tra gli item del DB
6. Text-To-Speech: testo tradotto in audio, restituito un file audio.
7. Client: la Web Speech API riceve il file l'audio e lo riproduce.

#### Gruppi
- Sviluppata tramite Angular.
- Possibilità solo a utenti amministratori o professori di creare gruppi. Per accedere alla stanza condiviso un codice univoco dal professore (richiesto login per accedere alla stanza).
- Visita di gruppo controllata dal docente, lasciata libertà di approfondimento e modifica impostazioni agli studenti.
- Quiz a fine visita

#### Qr-Code
- Possibilità di scansionare qr-code direttamente dall'applicazione per avere una descrizione dell'opera associata

---

### Applicazione marketplace

#### Marketplace
- È stato sviluppato tramite web-components e Vanilla JS.
- L'integrazione di marketplace con i web-components permette di utilizzare le funzionalità del router di Angular e di avere un'unica SPA (Single Page Application) senza ricaricare la pagina. Questo viene fatto tramite l'uso di un componente Angular che funge da wrapper per i web-components, consentendo la gestione della navigazione e delle interazioni all'interno dell'applicazione Angular e tramite il componente Vanilla Router che seleziona il contenuto corretto
- Dal marketplace è possibile esplorare tutte le visite tramite filtri e barra di ricerca, cliccando su una visita o su un museo si viene reindirizzati alla pagina di dettaglio del museo o della visita.
- Dal marketplace è possibile anche creare una visita, selezionando il museo e gli item da inserire nella visita. Una volta creata la visita, questa viene salvata nel database e resa disponibile per la navigazione.

#### Visite
- La pagina di creazione delle visite implementa funzionalità di drag and drop per selezionare gli item da inserire nella visita. Le opere possono essere selezionate da una lista resa disponibile dal museo, allegati di una descrizione di default.È possibile aggiungere descrizioni personalizzate per ogni opera selezionata e ulteriori dettagli sull'opera. La pagina permette di aggiungere ulteriori informazioni sulla visita (es costo, durata, licenza...).
- Tre pagine principali:
    - Pagina di ricerca delle visite: permette di filtrare le visite in base a diversi parametri, come il museo, la durata, gli interessi e le opzioni aggiuntive.
    - Pagina di dettaglio della visita: mostra le informazioni della visita selezionata, gli item e la durata.
    - Pagina di creazione della visita: permette di creare una visita selezionando il museo e gli item da inserire nella visita.

---

### Server-side

#### Sicurezza
##### Access Token + Refresh Token (Backend)
- Access Token (JWT a breve durata).
- Refresh Token (JWT a lunga durata), salvato in un Cookie HttpOnly (non accessibile da JavaScript lato client).
- Logout con pulizia del cookie e revoca della sessione.
##### Middleware di Autenticazione e Ruoli (Backend)
- authenticate JWT in precisi endpoint.
- authorize Roles per bloccare l'accesso alle risorse a certi ruoli in specifici endpoint.
##### Signup, Login (Backend)
- registrazione: ruoli controllati, verifica mail per signup con password (password hashata) con invio codice per conferma
- opzione login con Google OAuth2.0 (senza password)
- opzione login con password
- grazie a verifica mail implementato il merge degli account su mail univoca

#### Immagini
- Multer: middleware che permette di creare un buffer in ram appositamente per i file caricati 
- Imager: controlla estensione del file in input
- File System: immagine salvata su file system e identificata da un campo nei modelli del db tramite url fs (backend/assets/...)

---

> ### ATTENZIONE
> Gli utenti di base inseriti nel database hanno password 12345678 come richiesto e nome utente autore1-2/visitatore1-2, ma per gestione del login è richiesta mail+password per accedere. Abbiamo semplicemente aggiunto il suffisso @artaround.it ai relativi utenti. Esempio d'accesso autore1:
> - email: autore1@artaround.it
> - password: 12345678

---

## Contributo individuale
Ci siamo inizialmente divisi l'organizzazione delle due macro componenti del progetto, frontend e backend. Nelle fasi successive del progetto la divisione è diventata sempre meno netta interagento tra le due parti. 
### Divisione iniziale del progetto
- Frontend - Samuele Grillini
- Backend - Davide Gamberini e Mattia Graziani
### Divisione singolare delle parti del progetto:
- **Davide Gamberini**: Creazione della visita, audio(TTS - STT), autenticazione(verifica con email, e salvataggio dati utente, e gestione token), caricamento e salvataggio delle immagini, deploy su gocker, salvataggio dati nel database(creazione dei modelli dati)
- **Samuele Grillini**: HomePage, Marketplace(pagina principale), creazione della visita, ricerca visita, navigator(principalmente frontend), qr-code, login(principalmente frontend), navbar e impostazioni utente(lingua, modalità ad alto contrasto, e modalità notte/giorno)
- **Mattia Graziani**: Creazione della visita, ricerca visita, navigator(sia frontend che backend), vista a gruppi e quiz, qr-code, autenticazione(in particolare la gestione dei token e la gestione dei dati nel database), deplpoy su gocker, salvataggio dati nel database(creazione dei modelli dati)

### LLM
- Generazione di contenuti delle visite
- Assistenza nel coding: inizialmente abbiamo generato molto codice tramite LLM, ma successivamente abbiamo deciso di ricominciare il lavoro da zero per avere un codice più scalabile, pulito e comprensibile. Quindi l'LLM è stato utile per dare un'idea su cosa scrivere, di fatto una documentazione di supporto. Sulla parte conclusiva del progetto, per piccole modifiche su codice già strutturato manualmente nella fase precedente, abbiamo usato LLM per comodità e velocità.
