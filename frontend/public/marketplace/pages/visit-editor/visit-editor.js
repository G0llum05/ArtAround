export class MktVisitEditor extends HTMLElement {
  constructor() {
    super();
    // Stato mappato fedelmente sul JSON Schema richiesto
    this.state = {
      museumId: null,
      museumName: "",
      title: "",
      description: "",
      image: "",
      price: 0,
      pricingType: "free", // Solo per logica UI
      duration: "",
      isDisableFriendly: false,
      license: "Standard Copyright",
      visit: []
    };
  }

  connectedCallback() {
    // Inizializza con una tappa vuota di partenza
    if (this.state.visit.length === 0) {
      this.addEmptyStop();
    }

    this.render();
    this.renderSequence();
    this.renderDetails();
    this.setupGlobalListeners();
  }

  // Metodo helper per aggiungere una tappa vuota in coda
  addEmptyStop() {
    this.state.visit.push({
      artworkId: null,
      artworkTitle: null,
      itemId: null,
      description: null,
      tellMeMore: null,
      length: null,
      language: null
    });
  }

  render() {
    this.innerHTML = `
      <main class="mkt-editor-page">
        <!-- HEADER SUPERIORE -->
        <header class="mkt-editor-header">
          <h1 class="mkt-editor-title" id="main-title">Nuova Visita</h1>
          <div class="mkt-editor-header-sub">
            <div class="mkt-museum-selector-area">
              <mkt-input-search-visit id="museum-selector"></mkt-input-search-visit>
            </div>
            <div class="mkt-editor-actions">
              <div class="mkt-status-indicator">
                <span class="mkt-status-dot"></span>
                <span>Bozza</span>
              </div>
              <button type="button" class="mkt-btn mkt-btn-outline">Anteprima</button>
              <button type="button" class="mkt-btn mkt-btn-primary" id="btn-publish">Salva & Pubblica</button>
            </div>
          </div>
        </header>

        <!-- GRIGLIA A TRE COLONNE -->
        <div class="mkt-three-column-grid">
          <aside class="mkt-column">
            <mkt-artwork-library></mkt-artwork-library>
          </aside>
          <section class="mkt-column" id="sequence-column" style="overflow-y: auto; padding-right: 0.5rem;"></section>
          <aside class="mkt-column" id="details-column"></aside>
        </div>
      </main>
    `;
  }

  // Permette di resettare il form se si sceglie un altro museo in corso d'opera
  resetState() {
    this.state.title = "";
    this.state.description = "";
    this.state.image = "";
    this.state.price = 0;
    this.state.pricingType = "free";
    this.state.duration = "";
    this.state.isDisableFriendly = false;
    this.state.license = "Standard Copyright";
    this.state.visit = [];
    this.addEmptyStop();
  }

  // Gestisce la colonna centrale indipendentemente
  renderSequence() {
    const sequenceContainer = this.querySelector('#sequence-column');
    if (!sequenceContainer) return; // BUG FIX: Ora è "!sequenceContainer"

    const sequenceHtml = this.state.visit.map((stop, index) => {
      let itemContentHtml = '';

      // Se l'opera è stata trascinata e ha un ID
      if (stop.artworkId) {
        itemContentHtml = `
          <div class="mkt-track-item">
            <div class="mkt-track-left">
              <span class="mkt-track-icon">
                <svg xmlns="http://www.w3.org/2000/svg" height="1.2rem" viewBox="0 -960 960 960" width="1.2rem" fill="currentColor"><path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-414v-386h240v240H560v320q0 66-47 113T400-120Zm0-80q33 0 56.5-23.5T480-280q0-33-23.5-56.5T400-360q-33 0-56.5 23.5T320-280q0 33 23.5 56.5T400-200Zm240-360h80v-80h-80v80Z"/></svg>
              </span>
              <div>
                <h5 class="mkt-track-title">${stop.description || 'Traccia generica collegata'}</h5>
                <p class="mkt-track-type">${stop.length ? stop.length + ' min' : 'In attesa di contenuti'} ${stop.language ? '• ' + stop.language : ''}</p>
              </div>
            </div>
          </div>
        `;

        return `
          <div class="mkt-stop-block">
            <div class="mkt-stop-header">
              <div class="mkt-stop-title-group">
                <span class="mkt-stop-number">${index + 1}</span>
                <h3 class="mkt-stop-heading">${stop.artworkTitle}</h3>
              </div>
              <button type="button" class="mkt-icon-btn mkt-remove-stop" data-index="${index}" title="Rimuovi Opera">
                <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
              </button>
            </div>
            ${itemContentHtml}
          </div>
        `;
      }
      // Se è una tappa vuota in attesa di Drop
      else {
        return `
          <div class="mkt-stop-block">
            <div class="mkt-stop-header">
              <div class="mkt-stop-title-group">
                <span class="mkt-stop-number" style="background-color: var(--outline);">${index + 1}</span>
                <h3 class="mkt-stop-heading" style="color: var(--outline);">Tappa Vuota</h3>
              </div>
            </div>
            <div class="mkt-empty-stop-dropzone" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.75rem" viewBox="0 -960 960 960" width="1.75rem" fill="currentColor">
                <path xmlns="http://www.w3.org/2000/svg" d="M800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h400v80H160v480h640v-280h80v280q0 33-23.5 56.5T800-160ZM240-320h280v-120H240v120Zm0-200h280v-120H240v120Zm360 200h120v-200H600v200Zm-440 80v-480 480Zm560-360v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/>
              </svg>
              <span>Trascina qui l'opera dalla libreria</span>
            </div>
          </div>
        `;
      }
    }).join('');

    sequenceContainer.innerHTML = `
      <h2 class="mkt-column-title">Sequenza Opere</h2>
      ${sequenceHtml}
    `;

    //Bisogna re-inizializzare il Drag & Drop a ogni render della sequenza
    this.setupSequenceDragAndDropListeners();
  }

  // BUG FIX: Funzione ripristinata per permettere il rilascio delle opere
  setupSequenceDragAndDropListeners() {
    const dropzones = this.querySelectorAll('.mkt-empty-stop-dropzone');

    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        zone.classList.add('mkt-drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('mkt-drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('mkt-drag-over');

        try {
          const rawData = e.dataTransfer.getData('application/json');
          if (!rawData) return;

          const artworkData = JSON.parse(rawData);
          const index = parseInt(zone.getAttribute('data-index'));

          this.state.visit[index].artworkId = artworkData.artworkId;
          this.state.visit[index].artworkTitle = artworkData.artworkTitle;

          // Se popoliamo l'ultima tappa, ne creiamo una nuova in fondo
          if (index === this.state.visit.length - 1) {
            this.addEmptyStop();
          }

          this.renderSequence();
        } catch (error) {
          console.error("Errore durante il parsing dell'opera trascinata:", error);
        }
      });
    });

    const removeBtns = this.querySelectorAll('.mkt-remove-stop');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.state.visit.splice(index, 1);
        if (this.state.visit.length === 0) this.addEmptyStop();
        this.renderSequence();
      });
    });
  }

  // Gestisce la colonna dei dettagli indipendentemente
  renderDetails() {
    const detailsContainer = this.querySelector('#details-column');
    detailsContainer.innerHTML = `
      <div class="mkt-editor-card">
      <h2 class="mkt-detail-column-title">Dettagli della Visita</h2>
        <div class="mkt-details-section">
          <label class="mkt-field-label" for="input-tour-title">Titolo</label>
          <input type="text" class="mkt-input" id="input-tour-title" value="${this.state.title}" placeholder="Es. I Segreti del Museo">
        </div>
        <div class="mkt-details-section">
          <label class="mkt-field-label" for="input-tour-desc">Descrizione</label>
          <textarea class="mkt-textarea" id="input-tour-desc" placeholder="Inserisci una breve panoramica...">${this.state.description}</textarea>
        </div>
        <div class="mkt-details-section">
          <label class="mkt-field-label">Immagine di Copertina</label>
          <div class="mkt-cover-upload-box">
            <svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 -960 960 960" width="2rem" fill="currentColor"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>
            <span style="font-size: var(--body-md-size);">Carica o trascina immagine</span>
          </div>
        </div>
        <div class="mkt-details-section">
          <label class="mkt-field-label" for="input-tour-duration">Durata Stimata</label>
          <input type="text" class="mkt-input" id="input-tour-duration" value="${this.state.duration}" placeholder="es. 1h 30m">
        </div>
        <div class="mkt-details-section">
          <label class="mkt-field-label" for="input-tour-license">Licenza dei Contenuti</label>
          <select class="mkt-select" id="input-tour-license">
            <option value="Standard Copyright" ${this.state.license === 'Standard Copyright' ? 'selected' : ''}>Standard Copyright</option>
            <option value="CC BY-NC-ND 4.0" ${this.state.license === 'CC BY-NC-ND 4.0' ? 'selected' : ''}>CC BY-NC-ND 4.0</option>
            <option value="Pubblico Dominio" ${this.state.license === 'Pubblico Dominio' ? 'selected' : ''}>Pubblico Dominio</option>
          </select>
        </div>
        <div class="mkt-details-section">
          <div class="mkt-toggle-row">
            <span class="mkt-field-label">Accessibile (Senza Barriere)</span>
            <label class="mkt-switch">
              <input type="checkbox" id="toggle-accessible" ${this.state.isDisableFriendly ? 'checked' : ''}>
              <span class="mkt-slider"></span>
            </label>
          </div>
        </div>
        <div class="mkt-details-section">
          <label class="mkt-field-label">Costo</label>
           <div class="mkt-pricing-options">
            <label class="mkt-pricing-card ${this.state.pricingType === 'free' ? 'mkt-selected' : ''}">
              <input type="radio" name="pricing" value="free" class="mkt-sr-only" ${this.state.pricingType === 'free' ? 'checked' : ''}>
              <svg class="mkt-pricing-icon" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
                <path d="M574-618q-12-30-35.5-47T482-682q-18 0-35 5t-31 19l-58-58q14-14 38-25.5t44-14.5v-84h80v82q45 9 79 36.5t51 71.5l-76 32ZM792-56 608-240q-15 15-41 24.5T520-204v84h-80v-86q-56-14-93.5-51T292-350l80-32q12 42 40.5 72t75.5 30q18 0 33-4.5t29-13.5L56-792l56-56 736 736-56 56Z"/>
              </svg>
              <span class="mkt-pricing-title">Gratuito</span>
              <span class="mkt-pricing-subtitle">Incluso nel biglietto</span>
            </label>

            <label class="mkt-pricing-card ${this.state.pricingType === 'premium' ? 'mkt-selected' : ''}">
              <input type="radio" name="pricing" value="premium" class="mkt-sr-only" ${this.state.pricingType === 'premium' ? 'checked' : ''}>
              <svg class="mkt-pricing-icon" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
                <path d="M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z"/>
              </svg>
              <span class="mkt-pricing-title">Premium</span>
              <span class="mkt-pricing-subtitle">Aggiunta a pagamento</span>
               <!-- Input Group elegante per il prezzo -->
               <div class="mkt-price-input-group ${this.state.pricingType === 'free' ? 'mkt-disabled' : ''}">
                   <span class="mkt-currency-symbol">€</span>
               <input type="number" class="mkt-price-input" id="input-tour-price" step="0.50" value="${this.state.price}" ${this.state.pricingType === 'free' ? 'disabled' : ''} placeholder="0.00">
               </div>
            </label>
          </div>

        </div>
      </div>
    `;
    this.setupDetailsListeners();
  }

  // Listener separati per non sovrascrivere l'intero DOM a ogni lettera
  setupDetailsListeners() {
    const titleInput = this.querySelector('#input-tour-title');
    const headerTitleEl = this.querySelector('#main-title');
    if (titleInput && headerTitleEl) {
      titleInput.addEventListener('input', (e) => {
        this.state.title = e.target.value.replace(/\b\w/g, char => char.toUpperCase());
        headerTitleEl.textContent = this.state.title || "Nuova Visita";
      });
    }

    const descInput = this.querySelector('#input-tour-desc');
    if (descInput) descInput.addEventListener('input', (e) => this.state.description = e.target.value);

    const durationInput = this.querySelector('#input-tour-duration');
    if (durationInput) durationInput.addEventListener('input', (e) => this.state.duration = e.target.value);

    const licenseSelect = this.querySelector('#input-tour-license');
    if (licenseSelect) licenseSelect.addEventListener('change', (e) => this.state.license = e.target.value);

    const toggleAcc = this.querySelector('#toggle-accessible');
    if (toggleAcc) toggleAcc.addEventListener('change', (e) => this.state.isDisableFriendly = e.target.checked);


    //Gestione prezzo dinamica
    const radios = this.querySelectorAll('input[name="pricing"]');
    const priceInput = this.querySelector('#input-tour-price');
    const priceGroup = this.querySelector('.mkt-price-input-group');
    const pricingCards = this.querySelectorAll('.mkt-pricing-card');

    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.pricingType = e.target.value;

        pricingCards.forEach(card => card.classList.remove('mkt-selected'));
        e.target.closest('.mkt-pricing-card').classList.add('mkt-selected');

        // 2. Abilita/Disabilita l'input visivamente e funzionalmente
        if (priceInput && priceGroup) {
          if (this.state.pricingType === 'free') {
            priceInput.disabled = true;
            priceGroup.classList.add('mkt-disabled');
            this.state.price = 0;
            priceInput.value = "0.00";
          } else {
            priceInput.disabled = false;
            priceGroup.classList.remove('mkt-disabled');
            priceInput.focus(); // Autofocus
          }
        }
      });
    });

    if (priceInput) {
      priceInput.addEventListener('input', (e) => this.state.price = parseFloat(e.target.value) || 0);
    }
  }

  setupGlobalListeners() {
    // Intercettazione salvataggio
    const btnPublish = this.querySelector('#btn-publish');
    if (btnPublish) {
      btnPublish.addEventListener('click', () => {
        // Pulizia: non inviare tappe vuote
        const finalVisitArray = this.state.visit.filter(v => v.artworkId !== null);

        // Costruzione del Payload conforme alle regole JSON
        const payload = {
          title: this.state.title,
          description: this.state.description,
          image: this.state.image,
          price: this.state.price,
          duration: this.state.duration,
          isDisableFriendly: this.state.isDisableFriendly,
          license: this.state.license,
          visit: finalVisitArray.map(v => ({
            artworkId: v.artworkId,
            itemId: v.itemId,
            description: v.description,
            tellMeMore: v.tellMeMore,
            length: v.length,
            language: v.language
          }))
        };
        console.log("Dati JSON inviati:", payload);
        alert("Visita pubblicata! Controlla la console.");
      });
    }

    // GESTIONE DEL COMPONENTE RICERCA MUSEO E INVIO ALLA LIBRERIA
    const museumSelector = this.querySelector('#museum-selector');
    if (museumSelector) {
      museumSelector.addEventListener('museumSelected', (e) => {
        const newMuseumId = e.detail;
        if (this.state.museumId === newMuseumId) return;

        // Se l'utente ha già compilato dati, facciamo apparire l'alert
        const hasData = this.state.title || this.state.description || this.state.visit.some(v => v.artworkId !== null);

        if (this.state.museumId && hasData) {
          const confirmClear = confirm("Attenzione: cambiando museo, tutti i dati inseriti per la visita attuale verranno persi. Vuoi procedere?");

          if (!confirmClear) {
            // Se rifiuta, re-iniettiamo il nome nell'input nativo per visualizzazione
            const input = museumSelector.querySelector('#search-input');
            if (input) input.value = this.state.museumName || '';
            return;
          }
        }

        // Accetta il reset -> Resetta stato e aggiorna UI
        this.state.museumId = newMuseumId;
        const input = museumSelector.querySelector('#search-input');
        this.state.museumName = input ? input.value : 'Museo Selezionato';

        this.resetState();

        // Reset header title
        const headerTitleEl = this.querySelector('#main-title');
        if (headerTitleEl) headerTitleEl.textContent = "Nuova Visita";

        this.renderSequence();
        this.renderDetails();

        //Passo il nuovo ID del museo al componente libreria
        const artworkLibrary = this.querySelector('mkt-artwork-library');
        if (artworkLibrary) {
          artworkLibrary.museumId = newMuseumId; // Questo richiamerà automaticamente il setter della libreria
        }
      });
    }
  }
}
