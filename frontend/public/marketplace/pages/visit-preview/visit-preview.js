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
    this.hasPurchased = false;
  }

  async connectedCallback() {
    try {
      if (!this.visitId || this.visitId === 'undefined') throw new Error('visit id undefined');
      this.state = await VisitService.getVisit(this.visitId);

      const userId = this.getUserId();
      if (userId) {
        const purchasedVisits = await VisitService.getUserPurchasedVisits(userId);
        const currentVisitId = this.visitId || this.state?.id || this.state?._id;
        this.hasPurchased = purchasedVisits.some(p => p === currentVisitId || p === String(this.state?.id) || p === String(this.state?._id));
      }
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

  isPaid() {
    const p = parseFloat(this.state?.price);
    return !isNaN(p) && p > 0;
  }

  formatPrice() {
    if (this.hasPurchased) {
      return "Già Acquistata ✓";
    }
    if (!this.isPaid()) {
      return "Gratuito (Incluso nel biglietto)";
    }
    return `€ ${parseFloat(this.state.price).toFixed(2)}`;
  }

  getUserId() {
    const attrUserId = this.getAttribute('data-user-id');
    if (attrUserId && attrUserId !== 'null' && attrUserId !== 'undefined') return attrUserId;
    try {
      const token = localStorage.getItem('artaround_accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload._id || null;
      }
    } catch (e) {}
    return null;
  }

  getUserRole() {
    const attrRole = this.getAttribute('data-user-role');
    if (attrRole && attrRole !== 'null' && attrRole !== 'undefined') return attrRole;
    try {
      const token = localStorage.getItem('artaround_accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || 'guest';
      }
    } catch (e) {}
    return 'guest';
  }

  render() {
    if (this.loading || !this.state) {
      this.innerHTML = `<div class="mkt-preview-page"><p>Caricamento in corso...</p></div>`;
      return;
    }

    const role = this.getUserRole();
    const isTeacherOrAdmin = role === 'teacher' || role === 'museumstaff' || role === 'admin';
    const isPaid = this.isPaid();
    const isPaidAndNotPurchased = isPaid && !this.hasPurchased;

    // Usa l'array 'visits' (o 'artworkNames') del backend per l'itinerario
    const itineraryHtml = this.state.visits && this.state.visits.length > 0
      ? this.state.visits.map(stop => {
        const title = stop.artworkTitle || (typeof stop.artwork === 'object' ? stop.artwork?.title : stop.artwork) || 'Opera';
        return `
        <div class="mkt-timeline-item">
          <div class="mkt-timeline-indicator">
            <div class="mkt-timeline-circle"></div>
            <div class="mkt-timeline-line"></div>
          </div>

          <div class="mkt-timeline-content">
            <h4 class="mkt-stop-title">${title}</h4>
          </div>
        </div>
      `;
      }).join('')
      : '<p>Nessuna tappa disponibile per questa visita.</p>';

    // Gestione immagine di fallback se l'array assets.images è vuoto
    const heroImage = getImageUrl(this.state?.assets);

    this.innerHTML = `
      <div class="mkt-preview-page">

        <header class="mkt-preview-header">
          <div class="mkt-header-nav">
            <button type="button" class="mkt-btn-back" id="btn-back" title="Torna indietro">
              <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
              </svg>
              <span>Indietro</span>
            </button>
          </div>
          <div class="mkt-header-top">
            <h1 class="mkt-preview-title">${this.state.title}</h1>
            <div class="mkt-header-buttons">
              <button type="button" class="mkt-btn-start-visit" id="btn-start-visit">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor">
                  <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
                ${isPaidAndNotPurchased ? 'Compra e Inizia' : 'Inizia Visita'}
              </button>

              ${isTeacherOrAdmin ? `
                <button type="button" class="mkt-btn-start-group-visit" id="btn-start-group-visit" title="Avvia questa visita in modalità guidata per la tua classe">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Avvia Visita di Gruppo
                </button>
              ` : ''}
            </div>
          </div>
          <div class="mkt-badge-group">

            <div class="mkt-badge mkt-badge-museum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M80-80v-80h80v-360H80v-80l400-280 400 280v80h-80v360h80v80H80Zm160-80h480-480Zm80-80h80v-160l80 120 80-120v160h80v-280h-80l-80 120-80-120h-80v280Zm400 80v-454L480-782 240-614v454h480Z"/>
              </svg>
              ${this.state.museumName || 'Museo'}
            </div>

            ${this.hasPurchased ? `
              <div class="mkt-badge mkt-badge-purchased">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Acquistata
              </div>
            ` : ''}

            ${this.state.disabledFriendly ? `
              <div class="mkt-badge mkt-badge-accessibility">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
                </svg>
                Disable Friendly
              </div>
            ` : ''}
          </div>

          ${isPaidAndNotPurchased ? `
            <div class="mkt-purchase-banner">
              <svg class="mkt-purchase-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>stai comprando la visita, presta attenzione al portafoglio</span>
            </div>
          ` : ''}
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
            <h3 class="mkt-info-card-title">${this.hasPurchased ? 'Stato Visita' : 'Costo Biglietto'}</h3>
            <div class="mkt-info-card-body">
              <span>${this.hasPurchased ? 'Disponibilità' : 'Prezzo della visita'}</span>
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

    const backBtn = this.querySelector('#btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let returnRoute = '/marketplace/visit/search';
        try {
          returnRoute = sessionStorage.getItem('mkt_return_route') || '/marketplace/visit/search';
        } catch (err) {}

        const navEvent = new CustomEvent('angular-navigate', {
          detail: {
            destination: returnRoute
          },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(navEvent);
      });
    }

    const startVisitBtn = this.querySelector('#btn-start-visit');
    if (startVisitBtn) {
      startVisitBtn.addEventListener('click', async () => {
        const visitId = this.visitId || this.state?.id || this.state?._id;
        const userId = this.getUserId();
        const isPaid = this.isPaid();

        // Se la visita è a pagamento e non è ancora stata acquistata
        if (isPaid && !this.hasPurchased) {
          // Se non è loggato: reindirizza al login
          if (!userId) {
            const currentUrl = window.location.pathname + window.location.search;
            const navEvent = new CustomEvent('angular-navigate', {
              detail: {
                destination: 'login',
                queryParams: {
                  returnUrl: currentUrl
                }
              },
              bubbles: true,
              composed: true
            });
            this.dispatchEvent(navEvent);
            return;
          }

          // Mostra l'alert di avviso acquisto
          const priceStr = this.state.price ? `€ ${parseFloat(this.state.price).toFixed(2)}` : '€ 0.00';
          alert(`stai comprando la visita al costo di ${priceStr}, attento al portafogli`);

          // Salva l'acquisto nel modello User.purchasedVisits
          try {
            await VisitService.purchaseVisit(visitId, userId);
            this.hasPurchased = true;
          } catch (e) {
            console.warn('Errore durante il salvataggio dell\'acquisto della visita:', e);
          }
        }

        let tone = 'adulto';
        let museumId = '';

        try {
          const visitForm = JSON.parse(sessionStorage.getItem('visit_form') || '{}');
          if (visitForm.chiSei) {
            const chiSeiLower = String(visitForm.chiSei).toLowerCase().trim();
            if (chiSeiLower.includes('bambin')) tone = 'bambino';
            else if (chiSeiLower.includes('stud')) tone = 'studente';
            else if (chiSeiLower.includes('spec')) tone = 'specialista';
            else if (chiSeiLower.includes('adult')) tone = 'adulto';
          }
          if (visitForm.museumId) {
            museumId = visitForm.museumId;
          }
        } catch (e) {
          console.warn('Errore lettura visit_form:', e);
        }

        const isValidObjectId = (str) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str.trim());
        const validMuseumId = isValidObjectId(museumId) ? museumId.trim() : (isValidObjectId(this.state?.museumId) ? this.state.museumId.trim() : '');

        const getActiveLanguage = () => {
          const supported = ['it', 'en', 'es', 'fr', 'de', 'pt'];
          try {
            const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
            if (match && match[2]) {
              const parts = match[2].split('/');
              const target = parts[2] ? parts[2].toLowerCase() : '';
              if (supported.includes(target)) {
                return target;
              }
            }
          } catch (e) {}

          try {
            const htmlLang = (document.documentElement.lang || '').toLowerCase().slice(0, 2);
            if (supported.includes(htmlLang)) {
              return htmlLang;
            }
          } catch (e) {}

          return 'it';
        };

        const activeLang = getActiveLanguage();

        const navigatorSettings = {
          tone: tone,
          language: activeLang,
          duration: 30
        };
        localStorage.setItem('navigatorSettings', JSON.stringify(navigatorSettings));

        let returnRoute = '';
        try {
          returnRoute = sessionStorage.getItem('mkt_return_route') || '';
        } catch (e) {}

        const fromMuseum = returnRoute.includes('/museum/') || returnRoute.startsWith('/marketplace/museum');

        const navEvent = new CustomEvent('angular-navigate', {
          detail: {
            destination: 'navigator',
            queryParams: {
              visitId: visitId,
              ...(validMuseumId ? { museumId: validMuseumId } : {}),
              ...(fromMuseum ? { openSettings: 'true' } : {})
            }
          },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(navEvent);
      });
    }

    const startGroupVisitBtn = this.querySelector('#btn-start-group-visit');
    if (startGroupVisitBtn) {
      startGroupVisitBtn.addEventListener('click', () => {
        const visitId = this.visitId || this.state?.id || this.state?._id;
        const navEvent = new CustomEvent('angular-navigate', {
          detail: {
            destination: 'groups/room',
            queryParams: {
              visitId: visitId,
              visitTitle: this.state?.title || ''
            }
          },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(navEvent);
      });
    }

    const heroImgEl = this.querySelector('.mkt-preview-hero-img img');
    if (heroImgEl) {
      heroImgEl.addEventListener('error', () => {
        heroImgEl.src = '/assets/images/place_holder.jpg';
      });
    }
  }
}
