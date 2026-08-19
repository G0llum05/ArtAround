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

          <span class="mkt-stop-meta">
            <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z"/></svg>
            ${stop.length} min

            <svg xmlns="http://www.w3.org/2000/svg" style="margin-left: 0.5rem;" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-38-65-81.5T190-636h86q20 32 46.5 64.5T372-506q50-51 86.5-108.5T486-720H40v-80h280v-80h80v80h280v80H562q-17 55-49 110.5T432-416l106 106-56 56-110-110-212 212Zm468-160h264l-132-378-132 378Z"/></svg>
            ${stop.language}
          </span>

          <p class="mkt-stop-desc">${stop.description}</p>
        </div>
      </div>
    `).join('');

    this.innerHTML = `
      <!-- NOTA: l'intera pagina è il contenitore della griglia css -->
      <div class="mkt-preview-page">

        <header class="mkt-preview-header">
          <h1 class="mkt-preview-title">${this.state.title}</h1>
          <div class="mkt-badge-group">
            <div class="mkt-badge mkt-badge-museum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Zm80-80h80v-280h320v280h80v-360L480-690 240-480v360Zm160-360h160q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560Zm80 0Z"/></svg>
              ${this.state.museumName}
            </div>

            <div class="mkt-badge mkt-badge-museum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z"/></svg>
              Durata stimata: ${this.state.duration}
            </div>

            ${this.state.isDisableFriendly ? `
              <div class="mkt-badge mkt-badge-accessibility">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-720q25 0 42.5-17.5T540-780q0-25-17.5-42.5T480-840q-25 0-42.5 17.5T420-780q0 25 17.5 42.5T480-720ZM240-200q-50 0-85-35t-35-85q0-50 35-85t85-35q21 0 40 7t36 21l32-26-30-58 68-36 74 130H640v80H460l-30-54q-19 14-41.5 21.5T344-320q0 43-28.5 71.5T240-220q-33 0-56.5-23.5T160-300q0-33 23.5-56.5T240-380q20 0 36 9.5t26 26.5l26-16-16-32q-11-20-26-35.5T244-454q-32-15-68-18.5t-72 4.5q-42 16-66 52.5T20-336q-1 30 11 58t32 50q20 22 47.5 35t59.5 13h150v-80H240Zm400 40q-17 0-28.5-11.5T600-200v-302L488-662l14-26 126 156 172-28h-80v-80h240v80q0 66-47 113T800-400v200q0 17-11.5 28.5T760-160h-120Z"/></svg>
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
              <span>${this.state.pricingType === 'premium' ? 'Intero Galleria' : 'Visita Libera'}</span>
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
