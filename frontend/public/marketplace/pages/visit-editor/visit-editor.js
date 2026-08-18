export class MktVisitEditor extends HTMLElement {
  constructor() {
    super();
    this.state = {
      title: "Fenice Rossa",
      museumName: "Galleria dell'Accademia",
      description: "",
      pricingType: "free",
      priceValue: "0.00"
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <main class="mkt-editor-page">

        <!-- HEADER SUPERIORE -->
        <header class="mkt-editor-header">
          <h1 class="mkt-editor-title">${this.state.title}</h1>
          <div class="mkt-editor-header-sub">
            <div class="mkt-museum-pill">
              <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/>
              </svg>
              <span>${this.state.museumName}</span>
            </div>

            <div class="mkt-editor-actions">
              <div class="mkt-status-indicator">
                <span class="mkt-status-dot"></span>
                <span>Bozza</span>
              </div>
              <button type="button" class="mkt-btn mkt-btn-outline">Anteprima</button>
              <button type="button" class="mkt-btn mkt-btn-primary">Salva & Pubblica</button>
            </div>
          </div>
        </header>

        <!-- GRIGLIA A TRE COLONNE -->
        <div class="mkt-three-column-grid">

          <!-- COLONNA 1: LIBRERIA MODULARE -->
          <aside class="mkt-column">
            <mkt-item-library></mkt-item-library>
          </aside>

          <!-- COLONNA 2: SEQUENZA TOUR (TOUR SEQUENCE) -->
          <section class="mkt-column">
            <h2 class="mkt-column-title">Sequenza del Tour</h2>

            <!-- Tappa 1 in Card -->
            <div class="mkt-editor-card">
              <div class="mkt-stop-header">
                <div class="mkt-stop-title-group">
                  <span class="mkt-stop-number">1</span>
                  <h3 class="mkt-stop-heading">Ingresso Sala Principale</h3>
                </div>
                <button type="button" class="mkt-icon-btn" aria-label="Opzioni tappa">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>
                </button>
              </div>

              <div class="mkt-track-item">
                <div class="mkt-track-left">
                  <span class="mkt-track-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1.2rem" viewBox="0 -960 960 960" width="1.2rem" fill="currentColor"><path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-414v-386h240v240H560v320q0 66-47 113T400-120Zm0-80q33 0 56.5-23.5T480-280q0-33-23.5-56.5T400-360q-33 0-56.5 23.5T320-280q0 33 23.5 56.5T400-200Zm240-360h80v-80h-80v80Z"/></svg>
                  </span>
                  <div>
                    <h5 class="mkt-track-title">Guida di Benvenuto (Adulti)</h5>
                    <p class="mkt-track-type">Traccia Predefinita</p>
                  </div>
                </div>
              </div>

              <div class="mkt-track-item">
                <div class="mkt-track-left">
                  <span class="mkt-track-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1.2rem" viewBox="0 -960 960 960" width="1.2rem" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"/></svg>
                  </span>
                  <div>
                    <h5 class="mkt-track-title">Guida di Benvenuto (Bambini)</h5>
                    <p class="mkt-track-type">Traccia Alternativa</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mkt-navigation-instruction-bar">
              <button type="button" class="mkt-nav-pill">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="M440-420v-360h80v360h-80Zm0 200v-80h80v80h-80Z"/></svg>
                Aggiungi Istruzione di Navigazione
              </button>
            </div>

            <!-- Tappa Vuota in Card -->
            <div class="mkt-editor-card">
              <div class="mkt-stop-header">
                <div class="mkt-stop-title-group">
                  <span class="mkt-stop-number" style="background-color: var(--outline);">2</span>
                  <h3 class="mkt-stop-heading">Tappa Vuota</h3>
                </div>
              </div>
              <div class="mkt-empty-stop-dropzone">
                <svg xmlns="http://www.w3.org/2000/svg" height="1.75rem" viewBox="0 -960 960 960" width="1.75rem" fill="var(--outline)"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h360l80 80h160q33 0 56.5 23.5T840-720v520q0 33-23.5 56.5T760-120H200Zm0-80h560v-520H572l-80-80H200v600Zm0-600v520-520Z"/></svg>
                <span>Trascina qui il contenuto dalla libreria</span>
              </div>
            </div>
          </section>

          <!-- COLONNA 3: DETTAGLI TOUR (TOUR DETAILS) -->
          <aside class="mkt-column">
            <h2 class="mkt-column-title">Dettagli del Tour</h2>

            <div class="mkt-editor-card">
              <div class="mkt-details-section">
                <label class="mkt-field-label" for="input-tour-title">Titolo del Tour</label>
                <input type="text" class="mkt-input" id="input-tour-title" value="${this.state.title}">
              </div>

              <div class="mkt-details-section">
                <label class="mkt-field-label" for="input-tour-desc">Descrizione</label>
                <textarea class="mkt-textarea" id="input-tour-desc" placeholder="Panoramica della visita...">${this.state.description}</textarea>
              </div>

              <div class="mkt-details-section">
                <label class="mkt-field-label">Immagine di Copertina</label>
                <div class="mkt-cover-upload-box">
                  <svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 -960 960 960" width="2rem" fill="currentColor"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>
                  <span>Carica immagine</span>
                </div>
              </div>

              <div class="mkt-details-section">
                <label class="mkt-field-label">Economia & Accesso</label>
                <div class="mkt-radio-group">
                  <label class="mkt-radio-label">
                    <input type="radio" name="pricing" value="free" ${this.state.pricingType === 'free' ? 'checked' : ''}>
                    Gratuito con l'ingresso
                  </label>
                  <label class="mkt-radio-label">
                    <input type="radio" name="pricing" value="premium" ${this.state.pricingType === 'premium' ? 'checked' : ''}>
                    Componente aggiuntivo Premium
                  </label>
                </div>

                <div class="mkt-price-row">
                  <span class="mkt-currency-symbol">€</span>
                  <input type="number" class="mkt-price-input" step="0.01" value="${this.state.priceValue}" ${this.state.pricingType === 'free' ? 'disabled' : ''}>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>
    `;
  }

  setupEventListeners() {
    const titleInput = this.querySelector('#input-tour-title');
    const headerTitleEl = this.querySelector('.mkt-editor-title');
    if (titleInput && headerTitleEl) {
      titleInput.addEventListener('input', (e) => {
        this.state.title = e.target.value;
        headerTitleEl.textContent = this.state.title || "Nuovo Tour";
      });
    }

    const descInput = this.querySelector('#input-tour-desc');
    if (descInput) {
      descInput.addEventListener('input', (e) => {
        this.state.description = e.target.value;
      });
    }

    const radios = this.querySelectorAll('input[name="pricing"]');
    const priceInput = this.querySelector('.mkt-price-input');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.pricingType = e.target.value;
        if (priceInput) {
          priceInput.disabled = (this.state.pricingType === 'free');
        }
      });
    });
  }
}
