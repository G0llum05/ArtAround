export class MktItemLibrary extends HTMLElement {
  constructor() {
    super();
    this.state = {
      searchQuery: '',
      activeFilter: 'all',
      items: [
        { id: 'item-001', title: "David (Dettaglio)", type: "audio", language: "IT", length: 2.45, image: "/assets/images/place_holder.jpg" },
        { id: 'item-002', title: "Introduzione Rinascimento", type: "text", language: "IT", length: 0, image: "" },
        { id: 'item-003', title: "Cappella Sistina (Affresco)", type: "audio", language: "IT", length: 4.10, image: "/assets/images/place_holder.jpg" }
      ]
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  get filteredItems() {
    return this.state.items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(this.state.searchQuery.toLowerCase());
      const matchesFilter = this.state.activeFilter === 'all' || item.type === this.state.activeFilter;
      return matchesSearch && matchesFilter;
    });
  }

  render() {
    const itemsHtml = this.filteredItems.map(item => `
      <div class="mkt-library-card" draggable="true" data-id="${item.id}">
        ${item.image ? `
          <img src="${item.image}" alt="${item.title}" class="mkt-library-thumb">
        ` : `
          <div class="mkt-library-doc-icon">
            <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
              <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80Zm-80 240q-33 0-56.5-23.5T160-200v-560q0-33 23.5-56.5T240-840h320l240 240v440q0 33-23.5 56.5T720-120H240Zm280-520v-200H240v560h480v-360H520ZM240-800v200-200 560-560Z"/>
            </svg>
          </div>
        `}
        <div class="mkt-library-info">
          <h4 class="mkt-library-item-title">${item.title}</h4>
          <p class="mkt-library-item-meta">${item.type === 'audio' ? '🎧' : '📄'} ${item.length ? item.length + ' min' : 'Testo'} • ${item.language}</p>
        </div>
      </div>
    `).join('');

    this.innerHTML = `
      <div class="mkt-library-card-wrapper">
        <h2 class="mkt-column-title">Libreria Contenuti</h2>

        <div class="mkt-search-wrapper">
          <svg class="mkt-search-icon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
          <input type="text" class="mkt-search-input" id="library-search" placeholder="Cerca audio o testi..." value="${this.state.searchQuery}">
        </div>

        <div class="mkt-filter-chips">
          <button type="button" class="mkt-chip ${this.state.activeFilter === 'all' ? 'mkt-active' : ''}" data-filter="all">Tutti</button>
          <button type="button" class="mkt-chip ${this.state.activeFilter === 'audio' ? 'mkt-active' : ''}" data-filter="audio">Audio</button>
          <button type="button" class="mkt-chip ${this.state.activeFilter === 'text' ? 'mkt-active' : ''}" data-filter="text">Testo</button>
        </div>

        <div class="mkt-library-items-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const searchInput = this.querySelector('#library-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.render();
        this.setupEventListeners();
      });
    }

    const chips = this.querySelectorAll('.mkt-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.state.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.render();
        this.setupEventListeners();
      });
    });
  }
}
