import { MuseumService } from "../../services/museum.service.js";

export class MktInputSearchText extends HTMLElement {
  constructor() {
    super();
    this.museums = [
      {
        id: 0,
        name: "nessun museo trovato"
      }
    ];
    this.selectedMuseumId = null;
    this.searchTerm = '';
    this.isDropdownOpen = false;
  }

  async connectedCallback() {
    this.render();
    try {
      this.museums = await MuseumService.getAllHomePresentationMuseums() || [{
        id: 0,
        name: "Nessun museo trovato"
      }];
      this.updateSuggestions();
    } catch (error) {
      console.error("Errore nel recupero dei musei:", error);
    }
  }

  get filteredMuseums() {
    const normalize = (str) =>
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const term = normalize(this.searchTerm.trim());

    let list = [...this.museums];
    if (term) {
      const searchWords = term.split(/\s+/);
      list = list.filter(museum => {
        const normalizedName = normalize(museum.name);
        return searchWords.every(word => normalizedName.includes(word));
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  get displayValue() {
    const found = this.museums.find(m => m.id === this.selectedMuseumId);
    return found ? found.name : this.searchTerm;
  }

  render() {
    const value = this.displayValue;
    const hasValue = Boolean(value && value.trim() !== '');

    this.innerHTML = `
      <div class="mkt-autocomplete-container">
        <div class="mkt-input-wrapper">
          <input
            type="text"
            class="mkt-custom-select"
            placeholder="Cerca e seleziona un museo..."
            value="${value}"
            id="search-input"
            autocomplete="off"
          />
          <button
            type="button"
            class="mkt-clear-btn"
            id="clear-btn"
            title="Cancella ricerca"
            aria-label="Cancella testo"
            style="${hasValue ? 'display: flex;' : 'display: none;'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
            </svg>
          </button>
        </div>
        <div id="mkt-suggestions-wrapper"></div>
      </div>
    `;
    this.setupEventListeners();
    this.updateSuggestions();
  }

  updateSuggestions() {
    const wrapper = this.querySelector('#mkt-suggestions-wrapper');
    if (!wrapper) return;

    const results = this.filteredMuseums;
    if (this.isDropdownOpen && results.length > 0) {
      wrapper.innerHTML = `
        <ul class="mkt-dropdown-suggestions">
          ${results.map(m => `<li class="mkt-suggestion-item" data-id="${m.id}">${m.name}</li>`).join('\n')}
        </ul>
      `;

      wrapper.querySelectorAll('.mkt-suggestion-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-id');
          const museum = this.museums.find(m => m.id === id);
          if (museum) this.selectMuseum(museum);
        });
      });
    } else {
      wrapper.innerHTML = '';
    }
  }

  updateClearBtnVisibility() {
    const clearBtn = this.querySelector('#clear-btn');
    const input = this.querySelector('#search-input');
    if (clearBtn && input) {
      const hasValue = Boolean(input.value && input.value.trim() !== '');
      clearBtn.style.display = hasValue ? 'flex' : 'none';
    }
  }

  setupEventListeners() {
    const input = this.querySelector('#search-input');
    const clearBtn = this.querySelector('#clear-btn');
    if (!input) return;

    input.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.selectedMuseumId = null;
      this.isDropdownOpen = true;
      this.updateClearBtnVisibility();
      if (!this.searchTerm.trim()) {
        this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
      }
      this.updateSuggestions();
    });

    input.addEventListener('focus', () => {
      this.isDropdownOpen = true;
      this.updateSuggestions();
    });

    input.addEventListener('click', () => {
      this.isDropdownOpen = true;
      this.updateSuggestions();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.searchTerm = '';
        this.selectedMuseumId = null;
        input.value = '';
        this.updateClearBtnVisibility();
        this.isDropdownOpen = true;
        this.updateSuggestions();
        input.focus();
        this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
      });
    }

    input.addEventListener('keydown', (event) => {
      const results = this.filteredMuseums;
      const tabPressed = event.key === 'Tab' && this.isDropdownOpen;
      const enterPressed = event.key === 'Enter' && this.isDropdownOpen;
      if ((tabPressed || enterPressed) && results.length > 0) {
        event.preventDefault();
        this.selectMuseum(results[0]);
      }
      if (event.key === 'Escape') {
        this.isDropdownOpen = false;
        this.updateSuggestions();
      }
    });

    document.addEventListener('click', (event) => {
      if (!this.contains(event.target)) {
        if (this.isDropdownOpen) {
          this.isDropdownOpen = false;
          this.updateSuggestions();
        }
      }
    });
  }

  selectMuseum(museum) {
    this.searchTerm = museum.name;
    this.selectedMuseumId = museum.id;
    this.isDropdownOpen = false;

    const input = this.querySelector('#search-input');
    if (input) input.value = museum.name;

    this.updateClearBtnVisibility();
    this.updateSuggestions();
    this.dispatchEvent(new CustomEvent('museumSelected', {
      detail: museum.id,
      bubbles: true,
      composed: true
    }));
  }
}

