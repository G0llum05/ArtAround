export class MktHomeInputFields extends HTMLElement {
  constructor() {
    super();
    this.state = {
      searchQuery: '',
      scope: 'all', // 'all' | 'museums' | 'visits'
      freeOnly: false,
      paidOnly: false,
      verified: false,
      newOnly: false,
      disableFriendly: false,
      duration: 'all', // 'all' | 'short' (<=1h) | 'medium' (1-2h) | 'long' (>2h)
      selectedCategories: []
    };

    this.isDrawerOpen = false;

    this.availableCategories = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setAvailableCategories(categories) {
    if (Array.isArray(categories) && categories.length > 0) {
      const merged = [...new Set([...categories, ...this.availableCategories])].filter(Boolean);
      this.availableCategories = merged;
      this.render();
      this.setupEventListeners();
    }
  }

  get activeFiltersCount() {
    let count = 0;
    if (this.state.scope !== 'all') count++;
    if (this.state.freeOnly) count++;
    if (this.state.paidOnly) count++;
    if (this.state.verified) count++;
    if (this.state.newOnly) count++;
    if (this.state.disableFriendly) count++;
    if (this.state.duration !== 'all') count++;
    if (this.state.selectedCategories.length > 0) count += this.state.selectedCategories.length;
    return count;
  }

  getActiveFiltersList() {
    const list = [];
    if (this.state.scope === 'museums') {
      list.push({ id: 'scope-museums', label: 'Solo Musei', category: 'Ambito', onRemove: () => this.setScope('all') });
    } else if (this.state.scope === 'visits') {
      list.push({ id: 'scope-visits', label: 'Solo Visite', category: 'Ambito', onRemove: () => this.setScope('all') });
    }

    if (this.state.freeOnly) {
      list.push({ id: 'freeOnly', label: 'Gratuite (0 €)', category: 'Prezzo', onRemove: () => this.toggleFilter('freeOnly') });
    }
    if (this.state.paidOnly) {
      list.push({ id: 'paidOnly', label: 'A pagamento', category: 'Prezzo', onRemove: () => this.toggleFilter('paidOnly') });
    }

    if (this.state.disableFriendly) {
      list.push({ id: 'disableFriendly', label: 'Accessibile per disabili', category: 'Accessibilità', onRemove: () => this.toggleFilter('disableFriendly') });
    }
    if (this.state.verified) {
      list.push({ id: 'verified', label: 'Verificate', category: 'Qualità', onRemove: () => this.toggleFilter('verified') });
    }
    if (this.state.newOnly) {
      list.push({ id: 'newOnly', label: 'Novità', category: 'Stato', onRemove: () => this.toggleFilter('newOnly') });
    }

    if (this.state.duration === 'short') {
      list.push({ id: 'duration', label: 'Durata: ≤ 1h', category: 'Durata', onRemove: () => this.setDuration('all') });
    } else if (this.state.duration === 'medium') {
      list.push({ id: 'duration', label: 'Durata: 1h - 2h', category: 'Durata', onRemove: () => this.setDuration('all') });
    } else if (this.state.duration === 'long') {
      list.push({ id: 'duration', label: 'Durata: > 2h', category: 'Durata', onRemove: () => this.setDuration('all') });
    }

    this.state.selectedCategories.forEach(cat => {
      list.push({
        id: `cat-${cat}`,
        label: `Tema: ${cat}`,
        category: 'Categoria',
        onRemove: () => this.toggleCategory(cat)
      });
    });

    return list;
  }

  getCompatActiveFiltersList() {
    const arr = [];
    if (this.state.newOnly) arr.push('new');
    if (this.state.freeOnly) arr.push('free');
    if (this.state.verified) arr.push('verified');
    if (this.state.disableFriendly) arr.push('disable-friendly');
    if (arr.length === 0) arr.push('all');
    return arr;
  }

  emitChanges() {
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: {
        filters: { ...this.state },
        activeFilter: this.getCompatActiveFiltersList()
      },
      bubbles: true,
      composed: true
    }));
  }

  emitSearchChange() {
    this.dispatchEvent(new CustomEvent('search-change', {
      detail: { query: this.state.searchQuery },
      bubbles: true,
      composed: true
    }));
  }

  setScope(scope) {
    this.state.scope = scope;
    this.emitChanges();
    this.render();
    this.setupEventListeners();
  }

  toggleFilter(prop) {
    if (prop === 'freeOnly') {
      this.state.freeOnly = !this.state.freeOnly;
      if (this.state.freeOnly) this.state.paidOnly = false;
    } else if (prop === 'paidOnly') {
      this.state.paidOnly = !this.state.paidOnly;
      if (this.state.paidOnly) this.state.freeOnly = false;
    } else {
      this.state[prop] = !this.state[prop];
    }
    this.emitChanges();
    this.render();
    this.setupEventListeners();
  }

  setDuration(duration) {
    this.state.duration = duration;
    this.emitChanges();
    this.render();
    this.setupEventListeners();
  }

  toggleCategory(cat) {
    const idx = this.state.selectedCategories.indexOf(cat);
    if (idx > -1) {
      this.state.selectedCategories.splice(idx, 1);
    } else {
      this.state.selectedCategories.push(cat);
    }
    this.emitChanges();
    this.render();
    this.setupEventListeners();
  }

  clearAllFilters() {
    this.state.scope = 'all';
    this.state.freeOnly = false;
    this.state.paidOnly = false;
    this.state.verified = false;
    this.state.newOnly = false;
    this.state.disableFriendly = false;
    this.state.duration = 'all';
    this.state.selectedCategories = [];
    this.emitChanges();
    this.render();
    this.setupEventListeners();
  }

  openDrawer() {
    this.isDrawerOpen = true;
    this.classList.add('mkt-drawer-is-open');
    const drawer = this.querySelector('#mkt-filters-drawer');
    const backdrop = this.querySelector('#mkt-drawer-backdrop');
    if (drawer) drawer.classList.add('mkt-drawer-open');
    if (backdrop) backdrop.classList.add('mkt-backdrop-visible');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.classList.remove('mkt-drawer-is-open');
    const drawer = this.querySelector('#mkt-filters-drawer');
    const backdrop = this.querySelector('#mkt-drawer-backdrop');
    if (drawer) drawer.classList.remove('mkt-drawer-open');
    if (backdrop) backdrop.classList.remove('mkt-backdrop-visible');
    document.body.style.overflow = '';
  }

  render() {
    this.classList.toggle('mkt-drawer-is-open', Boolean(this.isDrawerOpen));
    const activeFilters = this.getActiveFiltersList();
    const count = this.activeFiltersCount;

    this.innerHTML = `
      <div class="mkt-controls-section">
        <!-- Barra di ricerca unificata (Musei e Visite) -->
        <div class="mkt-search-wrapper">
          <svg class="mkt-search-icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input
            type="text"
            id="mkt-search-input"
            placeholder="Cerca musei o visite per nome, città, argomento..."
            value="${this.state.searchQuery}"
            autocomplete="off"
          />
          ${this.state.searchQuery ? `
            <button type="button" class="mkt-search-clear-btn" id="mkt-search-clear" title="Cancella testo">
              <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          ` : ''}
        </div>

        <!-- Pulsante apertura tendina filtri -->
        <button type="button" class="mkt-filter-menu-btn ${count > 0 ? 'mkt-has-active' : ''}" id="mkt-btn-open-filters" aria-label="Apri pannello filtri">
          <svg class="mkt-filter-icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
            <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/>
          </svg>
          <span class="mkt-filter-menu-text">${count == 0 ? 'Tutti i Filtri' : 'Filtri attivi: '} </span>
          ${count > 0 ? `<span class="mkt-filter-badge-counter">${count}</span>` : ''}
        </button>
      </div>

      <!-- Backdrop per la tendina laterale -->
      <div class="mkt-drawer-backdrop ${this.isDrawerOpen ? 'mkt-backdrop-visible' : ''}" id="mkt-drawer-backdrop"></div>

      <!-- Tendina laterale filtri (Off-canvas Drawer) -->
      <aside class="mkt-drawer-panel ${this.isDrawerOpen ? 'mkt-drawer-open' : ''}" id="mkt-filters-drawer" role="dialog" aria-label="Menù filtri di ricerca">
        <header class="mkt-drawer-header">
          <div class="mkt-drawer-header-title">
            <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor">
              <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/>
            </svg>
            <h2> ${count == 0 ? 'Tutti i Filtri' : 'Filtri: '}</h2>
            ${count > 0 ? `<span class="mkt-drawer-count-badge">${count} attivi</span>` : ''}
          </div>
          <div class="mkt-drawer-header-actions">
            ${count > 0 ? `<button type="button" class="mkt-drawer-btn-clear" id="mkt-drawer-clear-all">Azzera filtri</button>` : ''}
            <button type="button" class="mkt-drawer-btn-close" id="mkt-drawer-close" aria-label="Chiudi menù filtri">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="mkt-drawer-body">
          <!-- SEZIONE FILTRI ATTIVI -->
          ${activeFilters.length > 0 ? `
            <div class="mkt-drawer-section mkt-active-summary-section">
              <span class="mkt-drawer-section-title">Filtri attualmente attivi:</span>
              <div class="mkt-active-chips-cloud">
                ${activeFilters.map(f => `
                  <button type="button" class="mkt-active-chip-tag" data-filter-id="${f.id}" title="Rimuovi filtro: ${f.label}">
                    <span>${f.label}</span>
                    <span class="mkt-chip-remove-icon">✕</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="mkt-drawer-section mkt-no-active-summary">
              <span class="mkt-drawer-hint">Nessun filtro attivo: vengono visualizzati tutti i musei e tutte le visite.</span>
            </div>
          `}

          <!-- SEZIONE 1: AMBITO VISUALIZZAZIONE -->
          <div class="mkt-drawer-section">
            <h3 class="mkt-drawer-section-title">Cosa visualizzare</h3>
            <div class="mkt-chips-grid">
              <button type="button" class="mkt-drawer-chip ${this.state.scope === 'all' ? 'mkt-selected' : ''}" data-set-scope="all">Tutto</button>
              <button type="button" class="mkt-drawer-chip ${this.state.scope === 'museums' ? 'mkt-selected' : ''}" data-set-scope="museums">Solo Musei</button>
              <button type="button" class="mkt-drawer-chip ${this.state.scope === 'visits' ? 'mkt-selected' : ''}" data-set-scope="visits">Solo Visite</button>
            </div>
          </div>

          <!-- SEZIONE 2: PREZZO VISITE -->
          <div class="mkt-drawer-section">
            <h3 class="mkt-drawer-section-title">Prezzo delle Visite</h3>
            <div class="mkt-chips-grid">
              <button type="button" class="mkt-drawer-chip ${!this.state.freeOnly && !this.state.paidOnly ? 'mkt-selected' : ''}" data-set-price="any">Qualsiasi</button>
              <button type="button" class="mkt-drawer-chip ${this.state.freeOnly ? 'mkt-selected' : ''}" data-set-price="free">Solo Gratuite (0 €)</button>
              <button type="button" class="mkt-drawer-chip ${this.state.paidOnly ? 'mkt-selected' : ''}" data-set-price="paid">A pagamento</button>
            </div>
          </div>

          <!-- SEZIONE 3: CARATTERISTICHE & QUALITÀ VISITE -->
          <div class="mkt-drawer-section">
            <h3 class="mkt-drawer-section-title">Caratteristiche Visite</h3>
            <div class="mkt-chips-grid">
              <button type="button" class="mkt-drawer-chip ${this.state.disableFriendly ? 'mkt-selected' : ''}" data-toggle-prop="disableFriendly">
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                  <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
                </svg>
                Accessibile per disabili
              </button>
              <button type="button" class="mkt-drawer-chip ${this.state.verified ? 'mkt-selected' : ''}" data-toggle-prop="verified">
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                  <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z"/>
                </svg>
                Verificata dallo staff
              </button>
              <button type="button" class="mkt-drawer-chip ${this.state.newOnly ? 'mkt-selected' : ''}" data-toggle-prop="newOnly">
                Novità
              </button>
            </div>
          </div>

          <!-- SEZIONE 4: DURATA VISITE -->
          <div class="mkt-drawer-section">
            <h3 class="mkt-drawer-section-title">Durata della Visita</h3>
            <div class="mkt-chips-grid">
              <button type="button" class="mkt-drawer-chip ${this.state.duration === 'all' ? 'mkt-selected' : ''}" data-set-duration="all">Qualsiasi durata</button>
              <button type="button" class="mkt-drawer-chip ${this.state.duration === 'short' ? 'mkt-selected' : ''}" data-set-duration="short">Breve (≤ 1h)</button>
              <button type="button" class="mkt-drawer-chip ${this.state.duration === 'medium' ? 'mkt-selected' : ''}" data-set-duration="medium">Media (1h - 2h)</button>
              <button type="button" class="mkt-drawer-chip ${this.state.duration === 'long' ? 'mkt-selected' : ''}" data-set-duration="long">Lunga (> 2h)</button>
            </div>
          </div>

          <!-- SEZIONE 5: CATEGORIE & TEMI VISITE -->
          <div class="mkt-drawer-section">
            <div class="mkt-drawer-section-header-flex">
              <h3 class="mkt-drawer-section-title">Temi e Categorie Visite</h3>
              <span class="mkt-drawer-counter-hint">${this.state.selectedCategories.length} selezionate</span>
            </div>
            <div class="mkt-chips-grid">
              ${this.availableCategories.map(cat => {
      const isSelected = this.state.selectedCategories.includes(cat);
      return `
                  <button type="button" class="mkt-drawer-chip ${isSelected ? 'mkt-selected' : ''}" data-toggle-cat="${cat}">
                    ${cat}
                  </button>
                `;
    }).join('')}
            </div>
          </div>

          <!-- SEZIONE 6: FILTRI MUSEI -->
          <div class="mkt-drawer-section">
            <h3 class="mkt-drawer-section-title">Filtri Musei</h3>
            <div class="mkt-chips-grid">
              <button type="button" class="mkt-drawer-chip ${this.state.disableFriendly ? 'mkt-selected' : ''}" data-toggle-prop="disableFriendly">
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                  <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
                </svg>
                Accessibile per disabili
              </button>
            </div>
          </div>
        </div>

        <footer class="mkt-drawer-footer">
          <button type="button" class="mkt-drawer-footer-btn-secondary" id="mkt-drawer-footer-clear">Azzera tutto</button>
          <button type="button" class="mkt-drawer-footer-btn-primary" id="mkt-drawer-footer-apply">Mostra Risultati</button>
        </footer>
      </aside>
    `;
  }

  setupEventListeners() {
    // 1. Barra di ricerca
    const searchInput = this.querySelector('#mkt-search-input');
    const searchClear = this.querySelector('#mkt-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.emitSearchChange();
        const clearBtn = this.querySelector('#mkt-search-clear');
        if (!clearBtn && this.state.searchQuery) {
          this.render();
          this.setupEventListeners();
          const newInput = this.querySelector('#mkt-search-input');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        } else if (clearBtn && !this.state.searchQuery) {
          clearBtn.remove();
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.state.searchQuery = '';
        this.emitSearchChange();
        this.render();
        this.setupEventListeners();
        const input = this.querySelector('#mkt-search-input');
        if (input) input.focus();
      });
    }

    // 2. Apertura e chiusura drawer filtri
    const btnOpenFilters = this.querySelector('#mkt-btn-open-filters');
    const btnCloseDrawer = this.querySelector('#mkt-drawer-close');
    const backdrop = this.querySelector('#mkt-drawer-backdrop');
    const btnApply = this.querySelector('#mkt-drawer-footer-apply');

    if (btnOpenFilters) btnOpenFilters.addEventListener('click', () => this.openDrawer());
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', () => this.closeDrawer());
    if (backdrop) backdrop.addEventListener('click', () => this.closeDrawer());
    if (btnApply) btnApply.addEventListener('click', () => this.closeDrawer());

    // 3. Reset filtri dal drawer
    const btnClearDrawer = this.querySelector('#mkt-drawer-clear-all');
    const btnFooterClear = this.querySelector('#mkt-drawer-footer-clear');
    if (btnClearDrawer) btnClearDrawer.addEventListener('click', () => this.clearAllFilters());
    if (btnFooterClear) btnFooterClear.addEventListener('click', () => this.clearAllFilters());

    // 4. Rimozione singolo chip attivo nel drawer
    this.querySelectorAll('.mkt-active-chip-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const filterId = e.currentTarget.getAttribute('data-filter-id');
        const activeList = this.getActiveFiltersList();
        const found = activeList.find(item => item.id === filterId);
        if (found && typeof found.onRemove === 'function') {
          found.onRemove();
        }
      });
    });

    // 5. Controlli drawer: Ambito
    this.querySelectorAll('[data-set-scope]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scope = e.currentTarget.getAttribute('data-set-scope');
        this.setScope(scope);
      });
    });

    // 6. Controlli drawer: Prezzo
    this.querySelectorAll('[data-set-price]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-set-price');
        if (val === 'any') {
          this.state.freeOnly = false;
          this.state.paidOnly = false;
        } else if (val === 'free') {
          this.state.freeOnly = true;
          this.state.paidOnly = false;
        } else if (val === 'paid') {
          this.state.paidOnly = true;
          this.state.freeOnly = false;
        }
        this.emitChanges();
        this.render();
        this.setupEventListeners();
      });
    });

    // 7. Controlli drawer: Proprietà booleane
    this.querySelectorAll('[data-toggle-prop]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prop = e.currentTarget.getAttribute('data-toggle-prop');
        this.toggleFilter(prop);
      });
    });

    // 8. Controlli drawer: Durata
    this.querySelectorAll('[data-set-duration]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dur = e.currentTarget.getAttribute('data-set-duration');
        this.setDuration(dur);
      });
    });

    // 9. Controlli drawer: Categorie
    this.querySelectorAll('[data-toggle-cat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-toggle-cat');
        this.toggleCategory(cat);
      });
    });

    // 10. Pillole veloci orizzontali
    this.querySelectorAll('.mkt-quick-filters .mkt-filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        if (action === 'clear-all') {
          this.clearAllFilters();
        } else if (action === 'toggle-scope-museums') {
          this.setScope(this.state.scope === 'museums' ? 'all' : 'museums');
        } else if (action === 'toggle-scope-visits') {
          this.setScope(this.state.scope === 'visits' ? 'all' : 'visits');
        } else if (action === 'toggle-free') {
          this.toggleFilter('freeOnly');
        } else if (action === 'toggle-disable') {
          this.toggleFilter('disableFriendly');
        } else if (action === 'toggle-verified') {
          this.toggleFilter('verified');
        } else if (action === 'toggle-new') {
          this.toggleFilter('newOnly');
        }
      });
    });

    // 11. Tasto ESC per chiudere il drawer
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && this.isDrawerOpen) {
        this.closeDrawer();
      }
    };
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    this._escHandler = onKeyDown;
    document.addEventListener('keydown', this._escHandler);
  }

  disconnectedCallback() {
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    document.body.style.overflow = '';
  }
}
