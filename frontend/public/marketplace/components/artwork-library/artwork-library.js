import { MuseumService } from '../../services/museum.service.js';
import { getImageUrl } from '../../services/images.services.js';

export class MktArtworkLibrary extends HTMLElement {
  constructor() {
    super();
    this.isInitialized = false;
    this.state = {
      museumId: this.getAttribute('data-museum-id'),
      excludedIds: [],
      searchQuery: '',
      artworks: [],
      isLoading: false,
    };
  }

  static get observedAttributes() {
    return ['data-museum-id', 'data-excluded-ids'];
  }

  async attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (attribute === 'data-museum-id') {
      this.state.museumId = newValue;
      if (this.isInitialized) {
        await this.fetchMuseumArtworks();
      }
    } else if (attribute === 'data-excluded-ids') {
      try {
        this.state.excludedIds = newValue ? JSON.parse(newValue) : [];
      } catch {
        this.state.excludedIds = newValue ? newValue.split(',').map((s) => s.trim()) : [];
      }
      this.updateListUI();
    }
  }

  setExcludedIds(ids) {
    this.state.excludedIds = Array.isArray(ids) ? ids.map((id) => String(id)) : [];
    this.updateListUI();
  }

  async connectedCallback() {
    if (this.hasAttribute('data-excluded-ids')) {
      const attrVal = this.getAttribute('data-excluded-ids');
      try {
        this.state.excludedIds = attrVal ? JSON.parse(attrVal) : [];
      } catch {
        this.state.excludedIds = attrVal ? attrVal.split(',').map((s) => s.trim()) : [];
      }
    }
    this.render();
    this.setupEventListeners();
    this.isInitialized = true;
    await this.fetchMuseumArtworks();
  }

  getArtistNames(artistsArray) {
    if (!artistsArray || artistsArray.length === 0) return 'Artista ignoto';
    return artistsArray.map((a) => `${a.name || ''} ${a.surname || ''}`.trim()).join(', ');
  }

  get filteredArtworks() {
    const term = this.state.searchQuery.toLowerCase().trim();
    const excluded = new Set((this.state.excludedIds || []).map((id) => String(id)));

    return this.state.artworks.filter((art) => {
      const artId = String(art.id || art._id);
      if (excluded.has(artId)) {
        return false;
      }

      if (!term) return true;

      const matchTitle = art.title && art.title.toLowerCase().includes(term);
      const artistNames = this.getArtistNames(art.artists).toLowerCase();
      const matchArtist = artistNames.includes(term);
      return matchTitle || matchArtist;
    });
  }

  async fetchMuseumArtworks() {
    if (!this.state.museumId || this.state.museumId === 'null') {
      this.state.artworks = [];
      this.state.isLoading = false;
      this.updateListUI();
      return;
    }

    this.state.isLoading = true;
    this.updateListUI();

    try {
      this.state.artworks = await MuseumService.getAllMuseumArtWorks(this.state.museumId);
    } catch (error) {
      console.error('Errore nel caricamento della libreria opere:', error);
      this.state.artworks = [];
    } finally {
      this.state.isLoading = false;
      this.updateListUI();
    }
  }

  render() {
    this.innerHTML = `
      <div class="mkt-library-card-wrapper">
        <h2 class="mkt-column-title">Libreria Opere</h2>
        <div class="mkt-visit-search-wrapper">
          <svg class="mkt-search-icon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input type="text" class="mkt-search-input" id="library-search" placeholder="Cerca opera o artista..." value="${this.state.searchQuery}">
        </div>
        <div class="mkt-library-items-list" id="library-list-container"></div>
      </div>
    `;
    this.updateListUI();
  }

  updateListUI() {
    const listContainer = this.querySelector('#library-list-container');
    if (!listContainer) return;

    if (!this.state.museumId || this.state.museumId === 'null') {
      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--on-surface-variant); opacity: 0.7;">
          <svg xmlns="http://www.w3.org/2000/svg" height="3rem" viewBox="0 -960 960 960" width="3rem" fill="currentColor" style="margin-bottom: 0.5rem;">
            <path d="M160-80q-33 0-56.5-23.5T80-160v-480q0-33 23.5-56.5T160-720h160l160-160 160 160h160q33 0 56.5 23.5T880-640v480q0 33-23.5 56.5T800-80H160Zm0-80h640v-480H160v480Zm80-80h480L570-440 450-280l-90-120-120 160Zm502.5-217.5Q760-475 760-500t-17.5-42.5Q725-560 700-560t-42.5 17.5Q640-525 640-500t17.5 42.5Q675-440 700-440t42.5-17.5ZM404-720h152l-76-76-76 76ZM160-160v-480 480Z"/>
          </svg>
          <p style="font-size: var(--body-md-size); text-align: center; margin: 0;">Selezionare prima un museo<br>per visualizzare le opere.</p>
        </div>
      `;
      return;
    }

    if (this.state.isLoading) {
      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--primary);">
          <svg xmlns="http://www.w3.org/2000/svg" height="2.5rem" viewBox="0 -960 960 960" width="2.5rem" fill="currentColor" style="animation: spin 1.5s linear infinite; margin-bottom: 0.5rem;">
            <path d="M480-80q-84 0-157-31.5T196-196q-54-54-85.5-127T80-480q0-84 31.5-157T196-764q54-54 127-85.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 84-31.5 157T764-196q-54 54-127 85.5T480-80Z"/>
          </svg>
          <p style="font-size: var(--body-md-size); text-align: center; margin: 0;">Caricamento opere...</p>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
      `;
      return;
    }

    if (this.filteredArtworks.length === 0) {
      listContainer.innerHTML = `<p style="color: var(--on-surface-variant); font-size: var(--body-md-size); text-align: center; margin-top: 1rem;">Nessuna opera trovata.</p>`;
      return;
    }

    listContainer.innerHTML = this.filteredArtworks.map((art) => {
      const artistName = this.getArtistNames(art.artists);
      const imageSrc = getImageUrl(art?.assets, 'portrait');

      return `
        <div class="mkt-library-card" draggable="true" data-id="${art.id}">
          ${imageSrc ? `
            <img src="${imageSrc}" alt="${art.title}" class="mkt-library-thumb">
          ` : `
            <div class="mkt-library-doc-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
                <path d="M73-889 889-73l-57 57-104-104H200q-33 0-56.5-23.5T120-200v-528L16-832l57-57Zm287 447L200-282v82h448L544-304l-22 24-162-162ZM200-648v252l126-126-126-126Zm36-192h524q33 0 56.5 23.5T840-760v524l-80-80v-234L650-426l-57-57 167-187v-90H316l-80-80Zm357 357Zm-158 70ZM326-522Zm34 80Zm176-98Z"/>
              </svg>
            </div>
          `}
          <div class="mkt-library-info">
            <h4 class="mkt-library-item-title">${art.title}</h4>
            <p class="mkt-library-item-meta">
              <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"/>
              </svg>
              ${artistName}
            </p>
          </div>
        </div>
      `;
    }).join('');

    this.attachCardEventListeners();
  }

  attachCardEventListeners() {
    const cards = this.querySelectorAll('.mkt-library-card');
    cards.forEach((card) => {
      const artId = card.getAttribute('data-id');
      const artData = this.state.artworks.find((a) => a.id === artId);

      card.addEventListener('dragstart', (e) => {
        const dragPayload = {
          artworkId: artData.id,
          artworkTitle: artData.title,
          artworkArtist: this.getArtistNames(artData.artists),
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  setupEventListeners() {
    const searchInput = this.querySelector('#library-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.updateListUI();
      });
    }
  }
}
