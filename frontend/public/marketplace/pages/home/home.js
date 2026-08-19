import {goTo} from "../../router.js";
import {getImageUrl} from '../../services/images.services.js';
import {VisitService} from "../../services/visit.service.js";
import {MuseumService} from "../../services/museum.service.js";

export class MktHome extends HTMLElement {
  constructor() {
    super();
    this.activeFilter = ['all'];
    this.searchQuery = '';
    this.routes = window.location.pathname;

    this.allTop10Visits = [];
    this.allVisits = [];
    this.allMuseums = [];
  }

  async connectedCallback() {
    this.render();
    const museumsTrack = this.querySelector('#mkt-museums-track');
    const top10VisitsTrack = this.querySelector('#mkt-top10-visits-track');
    const allVisitsTrack = this.querySelector('#mkt-all-visits-track');

    try{
      this.allTop10Visits = await VisitService.getTop10VisitPresentation() || [];
      top10VisitsTrack.innerHTML = this.getFilteredVisitsHtml(this.allTop10Visits);
    } catch(error) {
      console.error("Errore nel recupero della top 10", error);
    }

    try{
      this.allVisits = await VisitService.getAllVisits() || [];
      allVisitsTrack.innerHTML = this.getFilteredVisitsHtml(this.allVisits);
    } catch(error) {
      console.error("Errore nel recupero delle visite", error);
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
      const assets = museum.assets || [];
      const imageUrl = getImageUrl(assets, "landscape")
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

  getFilteredVisitsHtml(allVisits) {
    let filteredVisits = [...allVisits];
    if (!this.activeFilter.includes('all')) {
      filteredVisits = filteredVisits.filter(visit => {
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
      const imageUrl = getImageUrl(visit.assets, "landscape");
      return `
        <mkt-visit-card
          data-title="${visit.title}"
          data-desc="${visit.description}"
          data-price="${visit.price}"
          data-image="${imageUrl}"
          data-duration="${visit.duration}"
          data-visit-id="${visit.id}">
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
              <div class="mkt-card-icon-wrapper">
                <svg class="mkt-top-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" height="24px">
                    <path xmlns="http://www.w3.org/2000/svg" d="M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 23-5.5 42T220-202q5 2 10 2h10Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Zm-190 80Z"/>
                </svg>
              </div>
              <div class="mkt-large-card-content">
                <h2>Crea Visita</h2>
                <p>Crea una visita su misura per te partendo da zero.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000">
                <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>
              </svg>
            </a>
            <a class="mkt-card mkt-large-card mkt-visit-card" id="mkt-btn-search-visits">
              <div class="mkt-card-icon-wrapper">
                <svg class="mkt-top-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" height="24px">
                  <path d="m600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z"/>
                </svg>
              </div>
              <div class="mkt-large-card-content">
                <h2>Cerca Visite</h2>
                <p>Cerca tra tutte le nostre visite quella che più ti piace.</p>
              </div>
              <svg class="mkt-card-svg mkt-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000">
                <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>
              </svg>
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
            ${this.getFilteredVisitsHtml(this.allTop10Visits)}
          </div>
        </section>

        <!-- TUTTE LE VISITE -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Visite in Evidenza</h2>
          <div class="mkt-horizontal-track" id="mkt-all-visits-track">
            ${this.getFilteredVisitsHtml(this.allVisits)}
          </div>
        </section>
      </div>
    `;
  }

  setupEventListeners() {
    const controls = this.querySelector('#mkt-controls');
    const museumsTrack = this.querySelector('#mkt-museums-track');
    const top10visitsTrack = this.querySelector('#mkt-top10-visits-track');
    const allVisitsTrack = this.querySelector('#mkt-all-visits-track');

    if (controls) {
      // Ascolta il cambiamento nella barra di ricerca
      controls.addEventListener('search-change', (e) => {
        this.searchQuery = e.detail.query;
        if (museumsTrack) museumsTrack.innerHTML = this.getMuseumsHtml();
      });

      // Ascolta il cambiamento nei filtri a pillola
      controls.addEventListener('filter-change', (e) => {
        this.activeFilter = e.detail.activeFilter;
        if (top10visitsTrack) top10visitsTrack.innerHTML = this.getFilteredVisitsHtml(this.allTop10Visits);
        if (allVisitsTrack) allVisitsTrack.innerHTML = this.getFilteredVisitsHtml(this.allVisits);
      });
    }

    const btnSearch = this.querySelector('#mkt-btn-search-visits');
    const btnCreate = this.querySelector('#mkt-btn-create-visit');

    if(btnSearch) goTo(btnSearch,`/marketplace/visit/search`, null)
    if(btnCreate) goTo(btnCreate, `/marketplace/visit/create`, null);
  }
}
