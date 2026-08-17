export class MktCardGrid extends HTMLElement {

  static get observedAttributes() {
    return ['data-is-loading', 'data-length'];
  }

  constructor() {
    super();
    //Attiviamo la Shadow DOM per isolare la struttura e far funzionare il <2slot> obbligatorio per
    //this.attachShadow({ mode: 'open' });
    this.isLoading = false;
    this.length = 0;
  }

  connectedCallback() {
    this.syncStateWithAttributes();
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.syncStateWithAttributes();
      this.render();
    }
  }

  syncStateWithAttributes() {
    this.isLoading = this.getAttribute('data-is-loading') === 'true';
    this.length = parseInt(this.getAttribute('data-length') || '0', 10);
  }

  getSkeletonHtml() {
    let skeletons = '';
    for (let i = 0; i < 6; i++) {
      skeletons += `
        <div class="mkt-skeleton-card">
          <div class="mkt-skeleton mkt-skeleton-img"></div>
          <div class="mkt-skeleton-content">
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 80%; height: 1.5rem;"></div>
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 60%;"></div>
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 50%;"></div>
          </div>
        </div>
      `;
    }
    return skeletons;
  }

  getEmptyStateHtml() {
    if (!this.isLoading && this.length === 0) {
      return `
        <div class="mkt-empty-state">
          <p>Nessuna visita corrisponde ai tuoi filtri.</p>
        </div>
      `;
    }
    return '';
  }

  render() {
    const subtitle = this.isLoading
      ? 'Stiamo caricando le visite secondo i tuoi interessi'
      : 'Visite trovate';

    // Se sta caricando, mostra gli skeleton. Altrimenti mostra lo slot per le card e lo stato vuoto se serve.
    const gridContent = this.isLoading
      ? this.getSkeletonHtml()
      : this.getEmptyStateHtml();

      this.innerHTML =
      `<section class="mkt-results-section">
        <header class="mkt-results-header">
          <h2 class="mkt-results-title">Visite</h2>
          <p class="mkt-results-subtitle">${subtitle}</p>
        </header>
        <div class="mkt-results-grid">
          ${gridContent}
        </div>
      </section>
    `;
  }
}
