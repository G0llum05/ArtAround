export class MktItemLibrary extends HTMLElement {
  constructor() {
    super();
    this.state = {
      searchQuery: '',
      activeFilter: 'all',
      items: [
        { id: 'art-1', title: "David (Dettaglio)", type: "audio", meta: "🎧 2:45 • EN, IT", image: "/assets/images/place_holder.jpg" },
        { id: 'doc-1', title: "Introduzione Rinascimento", type: "text", meta: "Testo • Note del Curatore", image: "" },
        { id: 'art-2', title: "Cappella Sistina (Affresco)", type: "audio", meta: "🎧 4:10 • IT", image: "/assets/images/place_holder.jpg" }
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
          <p class="mkt-library-item-meta">${item.meta}</p>
        </div>
      </div>
    `).join('');

    this.innerHTML = `
      <style>
        .mkt-library-card-wrapper {
          background-color: var(--surface);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .mkt-column-title {
          font-family: var(--font-serif);
          font-size: var(--headline-md-size);
          font-weight: var(--headline-md-weight);
          margin: 0;
          color: var(--on-surface);
        }
        .mkt-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .mkt-search-input {
          width: 100%;
          background-color: var(--background);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-default);
          padding: 0.6rem var(--spacing-md) 0.6rem 2.2rem;
          font-family: var(--font-sans);
          font-size: var(--body-md-size);
          color: var(--on-surface);
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .mkt-search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--surface-variant);
        }
        .mkt-search-icon {
          position: absolute;
          left: 0.75rem;
          width: 1rem;
          height: 1rem;
          color: var(--outline);
        }
        .mkt-filter-chips {
          display: flex;
          gap: var(--spacing-xs);
        }
        .mkt-chip {
          background-color: var(--background);
          border: 1px solid var(--outline-variant);
          color: var(--on-surface-variant);
          padding: 0.3rem 0.9rem;
          border-radius: var(--radius-full);
          font-size: var(--label-md-size);
          cursor: pointer;
          transition: all 0.2s;
        }
        .mkt-chip:hover {
          border-color: var(--primary);
        }
        .mkt-chip.mkt-active {
          background-color: var(--secondary);
          color: var(--on-secondary);
          border-color: var(--secondary);
        }
        .mkt-library-items-list {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
          gap: var(--spacing-sm);
          overflow-y: auto;
          max-height: calc(100vh - 18rem);
          padding-right: 0.25rem;
        }
        .mkt-library-card {
          background-color: var(--background);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-default);
          padding: var(--spacing-sm);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          cursor: grab;
          transition: transform 0.15s ease, border-color 0.2s ease;
        }
        .mkt-library-card:hover {
          border-color: var(--primary);
          transform: translateY(-1px);
        }
        .mkt-library-thumb {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: var(--radius-sm);
          object-fit: cover;
          background-color: var(--surface-variant);
        }
        .mkt-library-doc-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: var(--radius-sm);
          background-color: var(--surface-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--outline);
        }
        .mkt-library-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .mkt-library-item-title {
          font-weight: 600;
          font-size: var(--body-md-size);
          margin: 0;
          color: var(--on-surface);
        }
        .mkt-library-item-meta {
          font-size: var(--label-md-size);
          color: var(--on-surface-variant);
          margin: 0;
        }
      </style>

      <div class="mkt-library-card-wrapper">
        <h2 class="mkt-column-title">Libreria</h2>

        <div class="mkt-search-wrapper">
          <svg class="mkt-search-icon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input type="text" class="mkt-search-input" id="library-search" placeholder="Cerca opere, audio..." value="${this.state.searchQuery}">
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
