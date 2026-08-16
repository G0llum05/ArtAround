// public/marketplace/components/card-grid/card-grid.js

export class MktCardGrid extends HTMLElement {

  static get observedAttributes() {
    return ['data-is-loading', 'data-length'];
  }

  constructor() {
    super();
    // Inizializziamo lo stato interno
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
      this.render(); // Ridisegniamo il componente in base al nuovo stato
    }
  }

  // Sincronizza le stringhe dell'HTML con le variabili JavaScript
  syncStateWithAttributes() {
    this.isLoading = this.getAttribute('data-is-loading') === 'true';
    this.length = parseInt(this.getAttribute('data-length') || '0', 10);
  }

  // Crea la logica degli skeleton loader
  getSkeletonHtml() {
    let skeletons = '';
    // Creiamo 6 skeleton dummy, come nel tuo array [1,2,3,4,5,6] di Angular
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

  // Crea lo stato vuoto
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

    // Il tag <slot></slot> fa esattamente quello che faceva <ng-content></ng-content>.
    // Mostra qualsiasi cosa venga messa *dentro* il tag <mkt-card-grid> dall'esterno.

    // Attenzione: se stiamo caricando, non stampiamo lo slot ma solo gli skeleton.
    const gridContent = this.isLoading
      ? this.getSkeletonHtml()
      : `<slot></slot> ${this.getEmptyStateHtml()}`;

    this.innerHTML = `
      <section class="mkt-results-section">
        <header class="mkt-results-header">
          <h2 class="mkt-results-title">Musei</h2>
          <p class="mkt-results-subtitle">${subtitle}</p>
        </header>
        <div class="mkt-results-grid">
          ${gridContent}
        </div>
      </section>
    `;
  }
}
