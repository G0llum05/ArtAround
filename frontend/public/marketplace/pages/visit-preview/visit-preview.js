export class MktVisitPreview extends HTMLElement {
  constructor() {
    super();
    this.state = {
      title: "Rinascimento Segreto",
      museumName: "Galleria dell'Accademia di Firenze",
      duration: "1h 30m",
      description: "Un viaggio curato tra i capolavori meno noti del XV secolo, esplorando la tecnica e il simbolismo dietro le opere di Botticelli, Ghirlandaio e altri maestri. Questa visita guidata ti condurrà attraverso un percorso immersivo per svelare i dettagli nascosti che sfuggono all'occhio del visitatore comune.",
      image: "https://images.unsplash.com/photo-1574357276536-12bd405b63bc?auto=format&fit=crop&q=80&w=1200",
      price: 12.50,
      pricingType: "premium",
      isDisableFriendly: true,
      license: "Standard Copyright",
      visit: [
        {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },       {
          artworkTitle: "Busto di Augusto",
          description: "Analisi della ritrattistica imperiale e del potere politico.",
          length: 15,
          language: "IT/EN"
        },
        {
          artworkTitle: "La Nascita di Venere",
          description: "Il simbolismo della grazia divina e l'ispirazione neoplatonica di Botticelli.",
          length: 20,
          language: "IT/EN"
        },
        {
          artworkTitle: "La Primavera",
          description: "L'allegoria del regno dei Medici e i segreti botanici nascosti nel prato.",
          length: 25,
          language: "IT/EN"
        },
        {
          artworkTitle: "Adorazione dei Magi",
          description: "Il capolavoro incompiuto di Leonardo e l'innovazione prospettica.",
          length: 15,
          language: "IT/EN"
        },
        {
          artworkTitle: "Ritratto di Giovane Donna",
          description: "L'evoluzione del ritratto femminile nel Rinascimento fiorentino.",
          length: 15,
          language: "IT/EN"
        }
      ]
    };
  }

  connectedCallback() {
    this.render();
  }

  formatPrice() {
    if (this.state.pricingType === "free" || this.state.price === 0) {
      return "Gratuito (Incluso nel biglietto)";
    }
    return `€ ${this.state.price.toFixed(2)}`;
  }

  render() {
    const itineraryHtml = this.state.visit.map(stop => `
      <div class="mkt-timeline-item">

        <div class="mkt-timeline-indicator">
          <div class="mkt-timeline-circle"></div>
          <div class="mkt-timeline-line"></div>
        </div>

        <div class="mkt-timeline-content">
          <h4 class="mkt-stop-title">${stop.artworkTitle}</h4>
          <p class="mkt-stop-desc">${stop.description}</p>
        </div>
      </div>
    `).join('');

    this.innerHTML = `
      <div class="mkt-preview-page">

        <header class="mkt-preview-header">
          <h1 class="mkt-preview-title">${this.state.title}</h1>
          <div class="mkt-badge-group">
            <div class="mkt-badge mkt-badge-museum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path xmlns="http://www.w3.org/2000/svg" d="M80-80v-80h80v-360H80v-80l400-280 400 280v80h-80v360h80v80H80Zm160-80h480-480Zm80-80h80v-160l80 120 80-120v160h80v-280h-80l-80 120-80-120h-80v280Zm400 80v-454L480-782 240-614v454h480Z"/>
              </svg>
              ${this.state.museumName}
            </div>

            ${this.state.isDisableFriendly ? `
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
          <img src="${this.state.image}" alt="Copertina Visita">
        </div>

        <div class="mkt-details-grid">
          <div class="mkt-info-card mkt-desc-card">
            <h3 class="mkt-info-card-title">Descrizione</h3>
            <p class="mkt-info-card-body">${this.state.description}</p>
          </div>

          <div class="mkt-info-card mkt-price-card">
            <h3 class="mkt-info-card-title">Costo Biglietto</h3>
            <div class="mkt-info-card-body">
              <span>${this.state.pricingType === 'premium' ? 'Prezzo solo della guida' : 'Visita Libera'}</span>
              <span class="mkt-price-value">${this.formatPrice()}</span>
            </div>

            <h3 class="mkt-info-card-title mkt-second-title">Durata Visita</h3>
            <div class="mkt-info-card-body">
              <span>Tempo stimato</span>
              <span class="mkt-price-value">${this.state.duration}</span>
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
