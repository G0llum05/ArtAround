import { dummyMuseums, dummyVisits } from "../../dummydata.js";
import {goTo} from "../../router.js";
import {VisitService} from "../../services/visit.service.js";
import {MuseumService} from "../../services/museum.service.js";

export class MktHome extends HTMLElement {
  constructor() {
    super();
    this.activeFilter = ['all'];
    this.searchQuery = '';
    this.routes = window.location.pathname;

    this.allTop10Visits = [];
    this.allMuseums = [];
  }

  async connectedCallback() {
    this.render();
    const museumsTrack = this.querySelector('#mkt-museums-track');
    const top10VisitsTrack = this.querySelector('#mkt-top10-visits-track');

    try{
      this.allTop10Visits = await VisitService.getTop10VisitPresentation() || [];
      top10VisitsTrack.innerHTML = this.getFilteredVisitsHtml();
    } catch(error) {
      console.error("Errore nel recupero dei musei:", error);
    }

    try{
      this.allMuseums = await MuseumService.getAllHomePresentationMuseums() || [];
      museumsTrack.innerHTML = this.getMuseumsHtml();
    } catch(error) {
      console.error("Errore nel recupero dei musei:", error);
    }
    this.render();
    this.setupEventListeners();
  }

  getMuseumsHtml() {
    if (!this.allMuseums || this.allMuseums.length === 0) {
      return `<p class="mkt-empty-text">Nessun museo trovato.</p>`;
    }

    const filteredMuseums = this.allMuseums.filter(museum => {
      const query = this.searchQuery.toLowerCase();
      const matchName = (museum.name || '').toLowerCase().includes(query);
      const matchCity = (museum.city || '').toLowerCase().includes(query);
      return matchName || matchCity;
    });

    if (filteredMuseums.length === 0) {
      return `<p class="mkt-empty-text">Nessun museo trovato.</p>`;
    }

    return filteredMuseums.map(museum => {
      const images = museum.assets?.images || [];
      const imageUrl = images.find(img => img.orientation === "landscape")?.url
        || images[0]?.url
        || "../assets/images/place_holder.jpg";

      return `
        <mkt-museum-card
          data-title="${museum.name || ''}"
          data-city="${museum.city || ''}"
          data-desc="${museum.description || ''}"
          data-image="${imageUrl}"
          data-id="${museum.id}">
        </mkt-museum-card>
      `;
    }).join("\n");
  }

  getFilteredVisitsHtml() {
    let filteredVisits = this.allTop10Visits;
    if (!this.activeFilter.includes('all')) {
      filteredVisits = this.allTop10Visits.filter(visit => {
        return this.activeFilter.every(filter => {
          if (filter === 'new') return visit.isNew;
          if (filter === 'free') return visit.price == 0;
          return false;
        });
      });
    }

    if (filteredVisits.length <= 0) {
      return `<p class="mkt-empty-text">Nessuna visita trovata per questo filtro.</p>`;
    }

    return filteredVisits.map(visit => {
      const imageUrl = visit.assets?.images?.find(img => img.orientation === "landscape")?.url || visit.assets?.images?.[0]?.url || "../assets/images/place_holder.jpg";
      return `
        <mkt-visit-card
          data-title="${visit.title}"
          data-desc="${visit.description}"
          data-price="${visit.price}"
          data-image="${imageUrl}"
          data-duration="${visit.duration}">
        </mkt-visit-card>
      `;
    }).join("\n");
  }

  render() {
    this.innerHTML = `
      <div class="mkt-home-container">
        <!-- BENVENUTO E TOP ACTIONS -->
        <section class="mkt-hero-section">
          <h1 class="mkt-hero-title">Marketplace</h1>
          <p class="mkt-hero-desc">La nostra raccolta al completo. Cerca, esplora o crea visite su misura.</p>
        </section>

        <section class="mkt-main-section">
          <div class="mkt-empty-grid">
            <a class="mkt-card mkt-large-card mkt-create-visit-card" id="mkt-btn-create-visit">
              <div class="mkt-large-card-content">
                <h2>Crea Visita</h2>
                <p>Crea una visita su misura per te partendo da zero.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>
            <a class="mkt-card mkt-large-card mkt-visit-card" id="mkt-btn-search-visits">
              <div class="mkt-large-card-content">
                <h2>Cerca Visite</h2>
                <p>Cerca tra tutte le nostre visite quella che più ti piace.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
            </a>
          </div>
        </section>

        <!-- COMPONENTE INPUT -->
        <mkt-home-input-fields id="mkt-controls"></mkt-home-input-fields>

        <!-- I NOSTRI MUSEI -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">I Nostri Musei</h2>
          <div class="mkt-horizontal-track" id="mkt-museums-track">
            ${this.getMuseumsHtml()}
          </div>
        </section>

        <!-- VISITE IN EVIDENZA -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Visite in Evidenza</h2>
          <div class="mkt-horizontal-track" id="mkt-top10-visits-track">
            ${this.getFilteredVisitsHtml()}
          </div>
        </section>
      </div>
    `;
  }

  setupEventListeners() {
    const controls = this.querySelector('#mkt-controls');
    const museumsTrack = this.querySelector('#mkt-museums-track');
    const visitsTrack = this.querySelector('#mkt-top10-visits-track');

    if (controls) {
      // Ascolta il cambiamento nella barra di ricerca
      controls.addEventListener('search-change', (e) => {
        this.searchQuery = e.detail.query;
        if (museumsTrack) museumsTrack.innerHTML = this.getMuseumsHtml();
      });

      // Ascolta il cambiamento nei filtri a pillola
      controls.addEventListener('filter-change', (e) => {
        this.activeFilter = e.detail.activeFilter;
        if (visitsTrack) visitsTrack.innerHTML = this.getFilteredVisitsHtml();
      });
    }

    const btnSearch = this.querySelector('#mkt-btn-search-visits');
    const btnCreate = this.querySelector('#mkt-btn-create-visit');

    if(btnSearch) goTo(btnSearch,`/marketplace/visit/search`, null)
    if(btnCreate) goTo(btnCreate, `/marketplace/visit/create`, null);
  }
}
