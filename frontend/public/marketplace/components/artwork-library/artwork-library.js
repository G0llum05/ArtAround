

export class MktArtworkLibrary extends HTMLElement {
  constructor() {
    super();
    this.state = {
      museumId: this.getAttribute("data-museumId"),
      searchQuery: '',
      activeFilter: 'all',
      artworks: [],
      isLoading: false
    };
  }


  connectedCallback() {
    this.render();
    this.setupEventListeners();

    //Chiamata Http
    this.state.isLoading = true;
    this.updateListUI(); // Mostra il caricamento
    try {
      //HTTP
    } catch (error) {
      console.error("Errore nel caricamento della libreria:", error);
      this.state.artworks = [];
    } finally {
      this.state.isLoading = false;
      this.updateListUI(); // Mostra i risultati o "nessuna opera"
    }
  }

  getArtistNames(artistsArray) {
    if (!artistsArray || artistsArray.length === 0) return "Artista ignoto";
    return artistsArray.map(a => `${a.name || ''} ${a.surname || ''}`.trim()).join(', ');
  }

  get filteredArtworks() {
    const term = this.state.searchQuery.toLowerCase().trim();
    return this.state.artworks.filter(art => {
      const matchTitle = art.title && art.title.toLowerCase().includes(term);
      const artistNames = this.getArtistNames(art.artists).toLowerCase();
      const matchArtist = artistNames.includes(term);
      const matchesSearch = matchTitle || matchArtist;

      let matchesFilter = true;
      if (this.state.activeFilter !== 'all') {
        const type = art.details?.objectType?.toLowerCase() || '';
        matchesFilter = type === this.state.activeFilter;
      }
      return matchesSearch && matchesFilter;
    });
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
        <div class="mkt-filter-chips">
          <button type="button" class="mkt-chip mkt-active" data-filter="all">Tutte</button>
          <button type="button" class="mkt-chip" data-filter="pittura">Pittura</button>
          <button type="button" class="mkt-chip" data-filter="scultura">Scultura</button>
        </div>
        <div class="mkt-library-items-list" id="library-list-container"></div>
      </div>
    `;
    this.updateListUI();
  }

  updateListUI() {
    const listContainer = this.querySelector('#library-list-container');
    if (!listContainer) return;

    if (!this.state.museumId) {
      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--on-surface-variant); opacity: 0.7;">
          <svg xmlns="http://www.w3.org/2000/svg" height="3rem" viewBox="0 -960 960 960" width="3rem" fill="currentColor" style="margin-bottom: 0.5rem;">
            <path xmlns="http://www.w3.org/2000/svg" d="M160-80q-33 0-56.5-23.5T80-160v-480q0-33 23.5-56.5T160-720h160l160-160 160 160h160q33 0 56.5 23.5T880-640v480q0 33-23.5 56.5T800-80H160Zm0-80h640v-480H160v480Zm80-80h480L570-440 450-280l-90-120-120 160Zm502.5-217.5Q760-475 760-500t-17.5-42.5Q725-560 700-560t-42.5 17.5Q640-525 640-500t17.5 42.5Q675-440 700-440t42.5-17.5ZM404-720h152l-76-76-76 76ZM160-160v-480 480Z"/>
          </svg>
          <p style="font-size: var(--body-md-size); text-align: center; margin: 0;">Selezionare prima un museo<br>per visualizzare le opere.</p>
        </div>
      `;
      return;
    }

    if (this.filteredArtworks.length === 0) {
      listContainer.innerHTML = `<p style="color: var(--on-surface-variant); font-size: var(--body-md-size); text-align: center; margin-top: 1rem;">Nessuna opera trovata.</p>`;
      return;
    }

    //ArtWork
    listContainer.innerHTML = this.filteredArtworks.map(art => {
      const artistName = this.getArtistNames(art.artists);
      const imageSrc = (art.images && art.images.length > 0) ? art.images[0] : null; //TODO Controllare

      return `
        <div class="mkt-library-card" draggable="true" data-id="${art.id}">
          ${imageSrc ? `
            <img src="${imageSrc}" alt="${art.title}" class="mkt-library-thumb">
          ` : `
            <div class="mkt-library-doc-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
                <path xmlns="http://www.w3.org/2000/svg" d="M73-889 889-73l-57 57-104-104H200q-33 0-56.5-23.5T120-200v-528L16-832l57-57Zm287 447L200-282v82h448L544-304l-22 24-162-162ZM200-648v252l126-126-126-126Zm36-192h524q33 0 56.5 23.5T840-760v524l-80-80v-234L650-426l-57-57 167-187v-90H316l-80-80Zm357 357Zm-158 70ZM326-522Zm34 80Zm176-98Z"/>
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
    cards.forEach(card => {
      const artId = card.getAttribute('data-id');
      const artData = this.state.artworks.find(a => a.id === artId);
      //drag and drop
      card.addEventListener('dragstart', (e) => {
        const dragPayload = {
          artworkId: artData.id,
          artworkTitle: artData.title,
          artworkArtist: this.getArtistNames(artData.artists)
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

    const chips = this.querySelectorAll('.mkt-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        chips.forEach(c => c.classList.remove('mkt-active'));
        e.currentTarget.classList.add('mkt-active');
        this.state.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.updateListUI();
      });
    });
  }
}
