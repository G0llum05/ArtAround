export class MktHomeInputFields extends HTMLElement {
  constructor() {
    super();
    this.activeFilter = ['all'];
    this.searchQuery = '';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
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
    `;
  }

  setupEventListeners() {
    // Gestione Ricerca: emette l'evento 'search-change'
    const searchInput = this.querySelector('#mkt-museum-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.dispatchEvent(new CustomEvent('search-change', {
          detail: { query: this.searchQuery },
          bubbles: true,
          composed: true
        }));
      });
    }

    // 2. Gestione Filtri: aggiorna lo stato interno ed emette 'filter-change'
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

          const index = this.activeFilter.indexOf(selectedFilter);
          if (index > -1) {
            this.activeFilter.splice(index, 1);
          } else {
            this.activeFilter.push(selectedFilter);
          }

          if (this.activeFilter.length === 0) {
            this.activeFilter = ['all'];
          }
        }

        // Ridisegna solo i controlli interni
        this.render();
        this.setupEventListeners();

        // Notifica il Marketplace dei nuovi filtri
        this.dispatchEvent(new CustomEvent('filter-change', {
          detail: { activeFilter: this.activeFilter },
          bubbles: true,
          composed: true
        }));
      });
    });
  }
}
