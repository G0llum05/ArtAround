export class MktItemLibrary extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="mkt-column">
        <h2 class="mkt-column-title">Libreria</h2>

        <div class="mkt-search-wrapper">
          <svg class="mkt-search-icon" xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input type="text" class="mkt-search-input" placeholder="Cerca opere, audio...">
        </div>

        <div class="mkt-filter-chips">
          <button type="button" class="mkt-chip mkt-active" data-filter="all">Tutti</button>
          <button type="button" class="mkt-chip" data-filter="audio">Audio</button>
          <button type="button" class="mkt-chip" data-filter="video">Video</button>
        </div>

        <div class="mkt-library-items-list">
          <div class="mkt-library-card" draggable="true" data-id="artwork-1">
            <img src="/assets/images/place_holder.jpg" alt="David" class="mkt-library-thumb">
            <div class="mkt-library-info">
              <h4 class="mkt-library-item-title">David (Dettaglio)</h4>
              <p class="mkt-library-item-meta">🎧 2:45 • EN, IT</p>
            </div>
          </div>

          <div class="mkt-library-card" draggable="true" data-id="doc-1">
            <div class="mkt-library-doc-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="currentColor">
                <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80Zm-80 240q-33 0-56.5-23.5T160-200v-560q0-33 23.5-56.5T240-840h320l240 240v440q0 33-23.5 56.5T720-120H240Zm280-520v-200H240v560h480v-360H520ZM240-800v200-200 560-560Z"/>
              </svg>
            </div>
            <div class="mkt-library-info">
              <h4 class="mkt-library-item-title">Introduzione Rinascimento</h4>
              <p class="mkt-library-item-meta">Testo • Note del Curatore</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const chips = this.querySelectorAll('.mkt-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        chips.forEach(c => c.classList.remove('mkt-active'));
        e.currentTarget.classList.add('mkt-active');

        const filter = e.currentTarget.getAttribute('data-filter');
        const event = new CustomEvent('filterChanged', {
          detail: { filter },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(event);
      });
    });
  }
}
