import { dummyMuseums, dummyVisits } from "./dummydata.js";

export class Marketplace extends HTMLElement {
  constructor() {
    super();
    this.activeFilter = ['all']; // Filtro attivo per le pillole
    this.searchQuery = '';     // Testo inserito nella ricerca musei

    this.allVisits = dummyVisits;
    this.allMuseums = dummyMuseums;
  }

  connectedCallback() {
    this.render();
  }

  // Genera l'HTML dei musei filtrati in tempo reale tramite la barra di ricerca
  getMuseumsHtml() {
    const filteredMuseums = this.allMuseums.filter(museum => {
      const query = this.searchQuery.toLowerCase();
      const matchName = museum.name.toLowerCase().includes(query);
      const matchCity = museum.city.toLowerCase().includes(query);
      return matchName || matchCity;
    });

    if (filteredMuseums.length === 0) {
      return `<p class="mkt-empty-text">Nessun museo trovato.</p>`;
    }

    return filteredMuseums.map(museum => {
      const imageUrl = museum.assets.images.find(img => img.orientation === "landscape")?.url || museum.assets.images[0]?.url || "../assets/images/place_holder.jpg";
      return `
        <mkt-museum-card
          data-title="${museum.name}"
          data-city="${museum.city}"
          data-desc="${museum.description}"
          data-image="${imageUrl}">
        </mkt-museum-card>
      `;
    }).join("\n");
  }

  render() {
    // Filtraggio delle visite in base alla pillola attiva
    let filteredVisits = this.allVisits;
    if (!this.activeFilter.includes('all')) {
      filteredVisits = this.allVisits.filter(v => {
        return this.activeFilter.some(filter => {
          if (filter === 'new') return v.new;
          if (filter === 'free') return v.price === 'Gratis';
          return false;
        });
      });
    }

    const visitElements = filteredVisits.length > 0 ? filteredVisits.map(visit => {
      const imageUrl = visit.assets?.images?.find(img => img.orientation === "landscape")?.url || visit.assets?.images?.[0]?.url || "../assets/images/place_holder.jpg";
      return `
        <mkt-visit-card
          data-title="${visit.title}"
          data-desc="${visit.description}"
          data-price="${visit.price || '€ 10,00'}"
          data-image="${imageUrl}">
        </mkt-visit-card>
      `;
    }).join("\n") : `<p class="mkt-empty-text">Nessuna visita trovata per questo filtro.</p>`;

    this.innerHTML = `
      <link rel="stylesheet" href="/marketplace/marketplace.css">
      <div class="mkt-home-container">

        <!-- BENVENUTO E TOP ACTIONS -->
        <section class="mkt-hero-section">
          <h1 class="mkt-hero-title">Marketplace</h1>
          <p class="mkt-hero-desc">La nostra raccolta al completo. Cerca, esplora o crea visite su misura.</p>
        </section>

        <section class="mkt-main-section">
          <div class="mkt-empty-grid">
            <a class="mkt-card mkt-large-card" id="mkt-btn-search-visits">
              <div class="mkt-large-card-content">
                <h2>Cerca Visite</h2>
                <p>Cerca tra tutte le nostre visite quella che più ti piace.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>
            <a class="mkt-card mkt-large-card mkt-visit-card" id="mkt-btn-create-visit">
              <div class="mkt-large-card-content">
                <h2>Crea Visita</h2>
                <p>Crea una visita su misura per te partendo da zero.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>
          </div>
        </section>

        <!-- SEZIONE CONTROLLI (Barra di Ricerca + Filtri a Pillola) -->
        <div class="mkt-controls-section">
           <!-- Filtri veloci (Pillole) -->
          <div class="mkt-quick-filters">
            <button class="mkt-filter-pill ${this.activeFilter.includes('all') ? 'mkt-active' : ''}" data-filter="all">Tutte</button>
            <button class="mkt-filter-pill ${this.activeFilter.includes('new') ? 'mkt-active' : ''}" data-filter="new">Novità</button>
            <button class="mkt-filter-pill ${this.activeFilter.includes('free') ? 'mkt-active' : ''}" data-filter="free">Gratuite</button>
          </div>

          <!-- Barra di ricerca musei -->
          <div class="mkt-search-wrapper">
            <input
              type="text"
              id="mkt-museum-search-input"
              placeholder="Cerca museo per nome o città..."
              value="${this.searchQuery}"
            />
          </div>
        </div>

        <!-- I NOSTRI MUSEI -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">I Nostri Musei</h2>
          <div class="mkt-horizontal-track" id="mkt-museums-track">
            ${this.getMuseumsHtml()}
          </div>
        </section>

        <!-- VISITE IN EVIDENZA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Visite in Evidenza</h2>
          <div class="mkt-horizontal-track" id="mkt-visits-track">
            ${visitElements}
          </div>
        </section>

      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Gestione input ricerca musei (aggiorna solo il carosello dei musei senza perdere il focus)
    const searchInput = this.querySelector('#mkt-museum-search-input');
    const museumsTrack = this.querySelector('#mkt-museums-track');

    if (searchInput && museumsTrack) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        museumsTrack.innerHTML = this.getMuseumsHtml();
        searchInput.focus();
        const length = searchInput.value.length;
        searchInput.setSelectionRange(length, length);
      });
    }

    // Gestione click sulle pillole dei filtri
    const pills = this.querySelectorAll('.mkt-filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const selectedFilter = e.target.getAttribute('data-filter');

        if (selectedFilter === 'all') {
          this.activeFilter = ['all'];
        } else {
          const allIndex = this.activeFilter.indexOf('all');
          if (allIndex > -1) {
            this.activeFilter.splice(allIndex, 1);
          }

          // Toggle del filtro cliccato
          const index = this.activeFilter.indexOf(selectedFilter);
          if (index > -1) {
            this.activeFilter.splice(index, 1);
          } else {
            this.activeFilter.push(selectedFilter);
          }

          // Se l'utente deseleziona tutto, riattiva 'all' di default
          if (this.activeFilter.length === 0) {
            this.activeFilter = ['all'];
          }
        }
        this.render();
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
