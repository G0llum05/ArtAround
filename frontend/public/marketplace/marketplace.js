// public/marketplace/components/mkt-home.js

export class MktHome extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <link rel="stylesheet" href="/marketplace/marketplace.css">
      <div class="mkt-home-container">

        <!-- BENVENUTO E SOTTOTITOLO -->
        <section class="mkt-hero-section">
          <h1 class="mkt-hero-title">Marketplace</h1>
          <p class="mkt-hero-desc">La nostra raccolta al completo. Cerca, esplora o crea visite su misura.</p>
        </section>

        <!-- TOP ACTIONS (Le due grandi card) -->
        <section class="mkt-main-section">
          <div class="mkt-empty-grid">

            <a class="mkt-card mkt-large-card" id="mkt-btn-search-visits">
              <div class="mkt-quick-icon mkt-text-primary">
                <!-- Icona Esplora -->
                <svg class="mkt-card-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z"/>
                </svg>
              </div>
              <div class="mkt-large-card-content">
                <h2>Cerca Visite</h2>
                <p>Cerca tra tutte le nostre visite quella che più ti piace.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>

            <a class="mkt-card mkt-large-card mkt-visit-card" id="mkt-btn-create-visit">
              <div class="mkt-quick-icon mkt-text-secondary">
                <!-- Icona Crea/Pianifica -->
                <svg class="mkt-card-svg" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="m600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z"/>
                </svg>
              </div>
              <div class="mkt-large-card-content">
                <h2>Crea Visita</h2>
                <p>Crea una visita su misura per te partendo da zero.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>

          </div>
        </section>

        <!-- FILTRI VELOCI -->
        <div class="mkt-quick-filters">
          <button class="mkt-filter-pill mkt-active">Tutte</button>
          <button class="mkt-filter-pill">Novità</button>
          <button class="mkt-filter-pill">Gratuite</button>
          <button class="mkt-filter-pill">Per Bambini</button>
          <button class="mkt-filter-pill">Accessibili</button>
          <button class="mkt-filter-pill">In Chiusura</button>
        </div>

        <!-- I NOSTRI MUSEI -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">I Nostri Musei</h2>
          <div class="mkt-horizontal-track">
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Pinacoteca</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">MAMbo</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Musei Universitari</h3></div></div>
          </div>
        </section>

        <!-- VISITE IN EVIDENZA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Visite in Evidenza</h2>
          <div class="mkt-horizontal-track">
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Tour Guidato</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Percorso Breve</h3></div></div>
          </div>
        </section>

        <!-- PITTURA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Pittura</h2>
          <div class="mkt-horizontal-track">
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Rinascimento</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Barocco</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Arte Moderna</h3></div></div>
          </div>
        </section>

        <!-- SCULTURA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Scultura</h2>
          <div class="mkt-horizontal-track">
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Classica</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Contemporanea</h3></div></div>
          </div>
        </section>

        <!-- ARCHITETTURA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Architettura</h2>
          <div class="mkt-horizontal-track">
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Gothic Tour</h3></div></div>
            <div class="mkt-card mkt-track-card"><div class="mkt-card-body"><h3 class="mkt-card-title">Modernismo</h3></div></div>
          </div>
        </section>

      </div>
    `;
  }

  setupEventListeners() {
    // Gestione visuale attiva/disattiva sui filtri veloci
    const pills = this.querySelectorAll('.mkt-filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('mkt-active'));
        e.target.classList.add('mkt-active');
      });
    });

    const btnSearch = this.querySelector('#mkt-btn-search-visits');
    const btnCreate = this.querySelector('#mkt-btn-create-visit');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => {
        console.log('[MKT] Cliccato: Cerca visite');
      });
    }

    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        console.log('[MKT] Cliccato: Crea visita');
      });
    }
  }
}
