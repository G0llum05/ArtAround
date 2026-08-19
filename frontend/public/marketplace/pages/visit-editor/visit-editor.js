import { VisitService } from '../../services/visit.service.js';

export class MktVisitEditor extends HTMLElement {
  constructor() {
    super();
    this.state = {
      museumId: null,
      museumName: "",
      title: "",
      description: "",
      image: "",
      price: 0,
      pricingType: "free",
      duration: "",
      isDisableFriendly: false,
      license: "Standard Copyright",
      visit: []
    };
    this.userId = null;
  }

  connectedCallback() {
    const draft = localStorage.getItem('mkt-visit-draft');
    if (draft) {
      if (confirm("Hai una bozza salvata per una visita. Vuoi riprenderla?")) {
        this.state = JSON.parse(draft);
      } else {
        localStorage.removeItem('mkt-visit-draft');
        if (this.state.visit.length === 0) this.addEmptyStop();
      }
    } else {
      if (this.state.visit.length === 0) this.addEmptyStop();
    }

    this.userId = this.getAttribute('data-user-id');

    this.render();
    this.renderSequence();
    this.renderDetails();
    this.setupGlobalListeners();

    // 2. RIPRISTINO VISIVO DELLA BOZZA (Se presente)
    if (this.state.museumId) {
      setTimeout(() => {
        const museumSelector = this.querySelector('#museum-selector');
        if (museumSelector) {
          const input = museumSelector.querySelector('#search-input');
          if (input) input.value = this.state.museumName;
        }
      }, 100);
    }
  }

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
          <h1 class="mkt-editor-title" id="main-title">${this.state.title || 'Nuova Visita'}</h1>
          <div class="mkt-editor-header-sub">
            <div class="mkt-museum-selector-area">
              <mkt-input-search-visit id="museum-selector"></mkt-input-search-visit>
            </div>
            <div class="mkt-editor-actions">
              <button type="button" class="mkt-btn mkt-btn-outline" id="btn-draft">Salva Bozza e Riprendi più tardi</button>
              <button type="button" class="mkt-btn mkt-btn-primary" id="btn-publish">Salva & Pubblica</button>
            </div>
          </div>
        </header>

        <!-- GRIGLIA A TRE COLONNE (2 SU MOBILE) -->
        <div class="mkt-three-column-grid">
          <aside class="mkt-column">
            <mkt-artwork-library data-museum-id="${this.state.museumId}" id="artworksLibrary"></mkt-artwork-library>
          </aside>
          <section class="mkt-column" id="sequence-column" style="overflow-y: auto; padding-right: 0.5rem;"></section>
          <aside class="mkt-column" id="details-column"></aside>
        </div>
      </main>
    `;
  }

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

  renderSequence() {
    const sequenceContainer = this.querySelector('#sequence-column');
    if (!sequenceContainer) return;

    const sequenceHtml = this.state.visit.map((stop, index) => {
      let itemContentHtml = '';

      if (stop.artworkId) {
        const isFirst = index === 0;
        const isLastPopulated = index >= this.state.visit.length - 2;
        const hasCustomDesc = stop.description && stop.description.trim() !== '';

        itemContentHtml = `
          <div class="mkt-stop-header">
            <div class="mkt-stop-title-group">
              <span class="mkt-stop-number">${index + 1}</span>
              <h3 class="mkt-stop-heading">${stop.artworkTitle}</h3>
            </div>

            <div class="mkt-stop-controls">
              <button type="button" class="mkt-icon-btn mkt-move-up" data-index="${index}" title="Sposta su" ${isFirst ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>
              </button>

              <button type="button" class="mkt-icon-btn mkt-move-down" data-index="${index}" title="Sposta giù" ${isLastPopulated ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
              </button>

              <button type="button" class="mkt-icon-btn mkt-remove-stop" data-index="${index}" title="Rimuovi Opera">
                <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
              </button>
            </div>
          </div>

          <div class="mkt-stop-body">
            <div class="mkt-details-section">
              <label class="mkt-field-label">Descrizione Audio / Tappa</label>
              <textarea class="mkt-textarea mkt-stop-input-desc" data-index="${index}" placeholder="Scrivi qui per sovrascrivere l'audio predefinito dell'opera...">${stop.description || ''}</textarea>
              <div class="mkt-default-badge-wrapper">
                <div class="mkt-default-badge ${hasCustomDesc ? 'mkt-hidden' : ''}" id="badge-desc-${index}">
                  <svg class="mkt-default-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                  Descrizione di default attiva
                </div>
              </div>
            </div>

            <div class="mkt-details-section">
              <label class="mkt-field-label">Approfondimento (Dimmi di più)</label>
              <textarea class="mkt-textarea mkt-stop-input-more" data-index="${index}" placeholder="Opzionale: Inserisci ulteriori dettagli storici...">${stop.tellMeMore || ''}</textarea>
            </div>
          </div>
        `;

        return `<div class="mkt-stop-block">${itemContentHtml}</div>`;
      } else {
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

    this.setupSequenceListeners();
  }

  setupSequenceListeners() {
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

    const upBtns = this.querySelectorAll('.mkt-move-up');
    upBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        if (idx > 0) {
          const temp = this.state.visit[idx];
          this.state.visit[idx] = this.state.visit[idx - 1];
          this.state.visit[idx - 1] = temp;
          this.renderSequence();
        }
      });
    });

    const downBtns = this.querySelectorAll('.mkt-move-down');
    downBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        if (idx < this.state.visit.length - 2) {
          const temp = this.state.visit[idx];
          this.state.visit[idx] = this.state.visit[idx + 1];
          this.state.visit[idx + 1] = temp;
          this.renderSequence();
        }
      });
    });

    const descInputs = this.querySelectorAll('.mkt-stop-input-desc');
    descInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const val = e.target.value;
        this.state.visit[idx].description = val;

        const badge = this.querySelector(`#badge-desc-${idx}`);
        if (badge) {
          if (val.trim() === '') {
            badge.classList.remove('mkt-hidden');
          } else {
            badge.classList.add('mkt-hidden');
          }
        }
      });
    });

    const moreInputs = this.querySelectorAll('.mkt-stop-input-more');
    moreInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        this.state.visit[idx].tellMeMore = e.target.value;
      });
    });
  }

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
          <label class="mkt-field-label" for="input-tour-desc">Descrizione Generale</label>
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

    const radios = this.querySelectorAll('input[name="pricing"]');
    const priceInput = this.querySelector('#input-tour-price');
    const priceGroup = this.querySelector('.mkt-price-input-group');
    const pricingCards = this.querySelectorAll('.mkt-pricing-card');

    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.pricingType = e.target.value;
        pricingCards.forEach(card => card.classList.remove('mkt-selected'));
        e.target.closest('.mkt-pricing-card').classList.add('mkt-selected');

        if (priceInput && priceGroup) {
          if (this.state.pricingType === 'free') {
            priceInput.disabled = true;
            priceGroup.classList.add('mkt-disabled');
            this.state.price = 0;
            priceInput.value = "0.00";
          } else {
            priceInput.disabled = false;
            priceGroup.classList.remove('mkt-disabled');
            priceInput.focus();
          }
        }
      });
    });

    if (priceInput) {
      priceInput.addEventListener('input', (e) => this.state.price = parseFloat(e.target.value) || 0);
    }
  }

  parseDurationToMinutes(durationStr) {
    if (!durationStr) return 0;

    const str = durationStr.toLowerCase().trim();

    const hoursMatch = str.match(/(\d+)\s*(h|ora|ore)/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;

    // Cerchiamo i numeri seguiti da m, min, minuto o minuti
    const minutesMatch = str.match(/(\d+)\s*(m|min|minut[oi])/);
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    let totalMinutes = (hours * 60) + minutes;

    // Fallback: se l'utente ha scritto solo un numero puro (es. "90") assumiamo siano minuti
    if (totalMinutes === 0 && /^\d+$/.test(str)) {
      totalMinutes = parseInt(str, 10);
    }

    return totalMinutes;
  }

  setupGlobalListeners() {
    // 3. LOGICA PULSANTE SALVA BOZZA
    const btnDraft = this.querySelector('#btn-draft');
    if (btnDraft) {
      btnDraft.addEventListener('click', () => {
        localStorage.setItem('mkt-visit-draft', JSON.stringify(this.state));
        alert("Bozza salvata con successo! Potrai riprenderla in qualsiasi momento.");
      });
    }

    const btnPublish = this.querySelector('#btn-publish');
    if (btnPublish) {
      btnPublish.addEventListener('click', async () => {
        const finalVisitArray = this.state.visit.filter(v => v.artworkId !== null);

        if(!this.userId || this.userId == "null"){
          alert("Non puoi pubblicare visite se non hai fatto l'accesso");
          localStorage.setItem('mkt-visit-draft', JSON.stringify(this.state));
          const navEvent = new CustomEvent('angular-navigate', {
            detail:  {
              destination: '/login'
            },
            bubbles: true,
            composed: true,
          })
          this.dispatchEvent(navEvent);
          return
        }

        const visit = {
          museumId: this.state.museumId,
          userId: this.userId,
          title: this.state.title,
          description: this.state.description,
          assets: {
            orientation: 'portrait',
            url: this.state.image.url,
          },
          price: this.state.price,
          isDisableFriendly: this.state.isDisableFriendly,
          license: this.state.license,
          duration: this.parseDurationToMinutes(this.state.duration),
          visit: finalVisitArray.map(v => ({
            artworkId: v.artworkId,
            itemId: v.itemId,
            description: v.description,
            tellMeMore: v.tellMeMore,
            length: v.length,
            language: v.language
          }))
        }

        console.log("Dati JSON inviati:", visit);
        const response = await VisitService.createVisit(visit);
        // RIMOZIONE BOZZA DOPO PUBBLICAZIONE

        if(response.ok){
          alert('Visita pubblicata! Controlla la console.');
          localStorage.removeItem('mkt-visit-draft');
          this.dispatchEvent(new CustomEvent('angular-navigate', {
            detail:  { destination: '/marketplace' },
            bubbles: true,
            composed: true,
          }));
        } else{
          alert('Errore durante il salvataggio')
        }
      });
    }

    const museumSelector = this.querySelector('#museum-selector');
    if (museumSelector) {
      const handleMuseumChange = (newMuseumId) => {
        if (this.state.museumId === newMuseumId) return;

        const hasData = this.state.title || this.state.description || this.state.visit.some(v => v.artworkId !== null);

        if (this.state.museumId && hasData && newMuseumId) {
          const confirmClear = confirm("Attenzione: cambiando museo, tutti i dati inseriti per la visita attuale verranno persi. Vuoi procedere?");
          if (!confirmClear) {
            const input = museumSelector.querySelector('#search-input');
            if (input) input.value = this.state.museumName || '';
            return;
          }
        }

        this.state.museumId = newMuseumId;
        const input = museumSelector.querySelector('#search-input');
        this.state.museumName = input ? input.value : 'Museo Selezionato';

        this.resetState();

        const headerTitleEl = this.querySelector('#main-title');
        if (headerTitleEl) headerTitleEl.textContent = "Nuova Visita";

        this.renderSequence();
        this.renderDetails();

        const artworksLibrary = this.querySelector('#artworksLibrary');
        if (artworksLibrary) {
          artworksLibrary.setAttribute('data-museum-id', newMuseumId || 'null');
        }
      };

      museumSelector.addEventListener('museumSelected', (e) => handleMuseumChange(e.detail));
      museumSelector.addEventListener('cleared', () => handleMuseumChange(null));
    }
  }
}
