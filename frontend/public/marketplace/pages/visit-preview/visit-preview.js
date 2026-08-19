import { VisitService } from '../../services/visit.service.js';
import { getImageUrl } from '../../services/images.services.js';

export class MktVisitPreview extends HTMLElement {
  constructor() {
    super();

    const pathname = window.location.pathname;
    const segments = pathname.split('/');

    this.visitId = segments[segments.length - 1];
    this.loading = true;
    this.state = [];
    this.hasViewed = false;
  }

  async connectedCallback() {
    try {
      if (!this.visitId || this.visitId === 'undefined') throw new Error('visit id undefined');
      // Assegniamo direttamente l'oggetto ricevuto dal backend a this.state
      this.state = await VisitService.getVisit(this.visitId);
    } catch (error){
      console.error(error);
    } finally {
      this.loading = false;
      this.render();
    }

    if (!this.hasViewed && this.visitId && this.visitId !== 'undefined') {
      this.hasViewed = true;
      try {
        await VisitService.postView(this.visitId);
      } catch(error){
        console.error("Errore postView:", error);
      }
    }
  }

  formatPrice() {
    if (!this.state.price || this.state.price === 0) {
      return "Gratuito (Incluso nel biglietto)";
    }
    return `€ ${this.state.price.toFixed(2)}`;
  }

  render() {
    if (this.loading || !this.state) {
      this.innerHTML = `<div class="mkt-preview-page"><p>Caricamento in corso...</p></div>`;
      return;
    }

    // Usa direttamente l'array 'visits' del backend
    const itineraryHtml = this.state.visits && this.state.visits.length > 0
      ? this.state.visits.map(stop => `
        <div class="mkt-timeline-item">
          <div class="mkt-timeline-indicator">
            <div class="mkt-timeline-circle"></div>
            <div class="mkt-timeline-line"></div>
          </div>

          <div class="mkt-timeline-content">
            <h4 class="mkt-stop-title"> ${stop.artwork}</h4>
          </div>
        </div>
      `).join('')
      : '<p>Nessuna tappa disponibile per questa visita.</p>';

    // Gestione immagine di fallback se l'array assets.images è vuoto
    const heroImage = getImageUrl(this.state?.assets);

    this.innerHTML = `
      <div class="mkt-preview-page">

        <header class="mkt-preview-header">
          <h1 class="mkt-preview-title">${this.state.title}</h1>
          <div class="mkt-badge-group">

            <div class="mkt-badge mkt-badge-museum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M80-80v-80h80v-360H80v-80l400-280 400 280v80h-80v360h80v80H80Zm160-80h480-480Zm80-80h80v-160l80 120 80-120v160h80v-280h-80l-80 120-80-120h-80v280Zm400 80v-454L480-782 240-614v454h480Z"/>
              </svg>
              ${this.state.museumId}
            </div>

            ${this.state.disabledFriendly ? `
              <div class="mkt-badge mkt-badge-accessibility">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
                </svg>
                Disable Friendly
              </div>
            ` : ''}
          </div>
        </header>

        <aside class="mkt-sidebar-col">
          <div class="mkt-itinerary-header">
            <h2 class="mkt-info-card-title" style="color: var(--on-surface); margin:0;">Itinerario della Visita</h2>
          </div>

          <div class="mkt-timeline">
            ${itineraryHtml}
          </div>
        </aside>

        <div class="mkt-preview-hero-img">
          <img src="${heroImage}" alt="Copertina Visita">
        </div>

        <div class="mkt-details-grid">
          <div class="mkt-info-card mkt-desc-card">
            <h3 class="mkt-info-card-title">Descrizione</h3>
            <p class="mkt-info-card-body">${this.state.description}</p>
          </div>

          <div class="mkt-info-card mkt-price-card">
            <h3 class="mkt-info-card-title">Costo Biglietto</h3>
            <div class="mkt-info-card-body">
              <span>Prezzo della visita</span>
              <span class="mkt-price-value">${this.formatPrice()}</span>
            </div>

            <h3 class="mkt-info-card-title mkt-second-title">Durata Visita</h3>
            <div class="mkt-info-card-body">
              <span>Tempo stimato</span>
              <span class="mkt-price-value">${this.state.minDuration}m - ${this.state.maxDuration}m</span>
            </div>
          </div>

          <div class="mkt-info-card">
            <h3 class="mkt-info-card-title">Licenza e Diritti</h3>
            <p class="mkt-info-card-body">${this.state.license}</p>
          </div>
        </div>

      </div>
    `;
  }
}
