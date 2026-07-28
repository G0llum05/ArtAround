# ArtAround
Progetto Tecnologie Web A.A. 2025/26

## Swagger API Backend

**swagger-autogen** è un tool che permette di generare automaticamente la documentazione Swagger per le API RESTful basate su Node.js e Express. Questo strumento analizza il codice sorgente dell'applicazione e genera un file di specifica Swagger (in formato JSON o YAML) che descrive le API disponibili, i loro endpoint, i parametri, le risposte e altri dettagli rilevanti.
- Per allineare i nuovi endpoint con la documentazione Swagger, è necessario eseguire il comando `npm run swagger` ogni volta che vengono aggiunti o modificati gli endpoint dell'API. Questo comando rigenererà automaticamente il file di specifica Swagger, garantendo che la documentazione sia sempre aggiornata e coerente con l'implementazione effettiva delle API.

**generatore CLI** per setuppare una nuova root api e generare automaticamente la documentazione Swagger per le API RESTful basate su Node.js e Express. Questo strumento analizza il codice sorgente dell'applicazione e genera un file di specifica Swagger (in formato JSON o YAML) che descrive le API disponibili, i loro endpoint, i parametri, le risposte e altri dettagli rilevanti.
- Usare il comando `npm run create:module <Nome>` per creare un nuovo modulo API. Questo comando genererà automaticamente la struttura di base del modulo, inclusi i file necessari per la gestione degli endpoint e la documentazione Swagger associata.
