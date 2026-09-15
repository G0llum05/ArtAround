import { getImageUrl } from '../../services/images.services.js';
import { MuseumService } from "../../services/museum.service.js";
import { VisitService } from "../../services/visit.service.js";

export class MktVisitExplorer extends HTMLElement {
  constructor() {
    super();
    this.state = {
      museumId: '',
      searchQuery: '',
      chiSei: 'Adulto',
      interessi: [],
      durata: 2,
      accessibile: false,
      gratuito: false,
      verificata: false
    };
    this.partialInterestsList = [];
    this.allInterests = [];

    this.loadingVisit = false;
    this.allMuseumVisit = [];
  }

  saveState() {
    try {
      sessionStorage.setItem('mkt_visit_explorer_state', JSON.stringify(this.state));
    } catch (e) { }
  }

  async connectedCallback() {
    try {
      const saved = sessionStorage.getItem('mkt_visit_explorer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) { }

    this.render();
    this.setupEventListeners();

    this.loadingVisit = true;
    this.updateGrid();

    try {
      if (this.state.museumId) {
        const searchComp = this.querySelector('#museum-search');
        if (searchComp) {
          searchComp.setAttribute('data-selected-id', this.state.museumId);
        }
        this.allMuseumVisit = await MuseumService.getAllMuseumVisits(this.state.museumId);
        const interests = this.allMuseumVisit?.flatMap(visit => visit.categories || []) || [];
        this.allInterests = [...new Set(interests)].filter(Boolean);
        this.allInterests.length = 10; //tronco se ci soon troppi interessi
      } else {
        this.allMuseumVisit = await VisitService.getAllVisits() || [];
        this.allInterests = [];
      }
    } catch (e) {
      console.error("Errore nel recupero delle visite:", e);
    } finally {
      this.loadingVisit = false;
      this.updateUI();
    }
  }

  updateState(key, value) {
    this.state[key] = value;
    this.saveState();
    this.updateUI();
  }

  get currentDurationStr() {
    const val = this.state.durata;
    let str = Math.floor(val) + 'h';
    if (val - Math.trunc(val) === 0.5) str += ' 30m';
    if (val === 8) str += '+';
    return str;
  }

  toggleInterest(interest) {
    if (interest === 'Qualsiasi') {
      if (this.state.interessi.length !== 0) {
        this.partialInterestsList = [...this.state.interessi];
      }
      this.state.interessi = [];
    } else {
      const index = this.state.interessi.indexOf(interest);
      if (index > -1) {
        this.state.interessi = [
          ...this.partialInterestsList,
          ...this.state.interessi.filter(i => i !== interest)
        ];
      } else {
        this.state.interessi = [
          ...this.state.interessi,
          ...this.partialInterestsList,
          interest
        ];
      }
      this.partialInterestsList = [];
    }
    this.saveState();
    this.updateUI();
  }

  get filteredVisits() {
    let list = [...(this.allMuseumVisit || [])];

    // Filtro per ricerca testuale
    if (this.state.searchQuery && this.state.searchQuery.trim()) {
      const q = this.state.searchQuery.toLowerCase().trim();
      list = list.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.categories || []).some(c => (c || '').toLowerCase().includes(q))
      );
    }

    // Filtro per interessi (se l'utente ha selezionato dei filtri specifici)
    if (this.state.interessi.length > 0) {
      list = list.filter(v =>
        v.categories && this.state.interessi.every(i => v.categories.includes(i))
      );
    }

    if (this.state.durata) {
      const maxMinutes = this.state.durata * 60;  //converto in minuti
      list = list.filter(v => !v.duration || v.duration <= maxMinutes);
    }
    if (this.state.accessibile) {
      list = list.filter(v => v.disableFriendly === true);
    }
    if (this.state.gratuito) {
      list = list.filter(v => v.price === 0 || v.price === '0' || v.price === 'Gratis');
    }
    if (this.state.verificata) {
      list = list.filter(v => v.isVerified);
    }
    return list;
  }

  updateUI() {
    // Gestione dei bottoni "Chi sei" (Ruoli)
    this.querySelectorAll('.mkt-role-btn').forEach(btn => {
      btn.classList.toggle('mkt-chip-active', btn.getAttribute('data-role') === this.state.chiSei);
    });

    // Gestione della durata
    const durationValEl = this.querySelector('.mkt-duration-value');
    if (durationValEl) durationValEl.textContent = this.currentDurationStr;

    // Gestione opzioni aggiuntive (Accessibile, Gratuito, Verificata)
    const btnAcc = this.querySelector('#btn-accessibile');
    const btnGrat = this.querySelector('#btn-gratuito');
    const btnVer = this.querySelector('#btn-verificata');

    if (btnAcc) btnAcc.classList.toggle('mkt-chip-active', this.state.accessibile);
    if (btnGrat) btnGrat.classList.toggle('mkt-chip-active', this.state.gratuito);
    if (btnVer) btnVer.classList.toggle('mkt-chip-active', this.state.verificata);

    // Gestione dinamica dei chip di Interessi (Generati con le classi corrette)
    const intersetGroup = this.querySelector('#interessi-group');
    if (intersetGroup) {
      const isAnyActive = this.state.interessi.length === 0;
      intersetGroup.classList.toggle('mkt-any-chip-active', isAnyActive);

      // Generiamo il bottone "Qualsiasi" con la classe attiva se nessun interesse è selezionato
      let html = `<button type="button" class="mkt-chip mkt-chip-qualsiasi ${isAnyActive ? 'mkt-chip-active' : ''}" data-value="Qualsiasi">Qualsiasi</button>\n`;

      // Generiamo gli altri chip applicando le classi active o partial direttamente
      html += this.allInterests.map(int => {
        const isActive = this.state.interessi.includes(int);
        const isPartial = this.partialInterestsList.includes(int);

        let cssClasses = 'mkt-chip';
        if (isActive) cssClasses += ' mkt-chip-active';
        if (isPartial) cssClasses += ' mkt-partial';

        return `<button type="button" class="${cssClasses}" data-value="${int}">${int}</button>`;
      }).join('');

      intersetGroup.innerHTML = html;
      this.setUpEventListenersInterests();
    }

    this.updateGrid();
  }

  updateGrid() {
    const visitGrid = this.querySelector("#results-container");
    if (!visitGrid) return;

    if (this.loadingVisit) {
      visitGrid.innerHTML = `<mkt-skeleton-card-grid></mkt-skeleton-card-grid>`;
      return;
    }

    if (!this.state.museumId && this.allMuseumVisit.length === 0) {
      visitGrid.innerHTML = `<p class="mkt-empty-text">Seleziona un museo per visualizzare le visite.</p>`;
      return;
    }

    const visitsToDisplay = this.filteredVisits;

    if (visitsToDisplay.length === 0) {
      visitGrid.innerHTML = `
        <section class="mkt-results-section">
          <header class="mkt-results-header">
            <h2 class="mkt-results-title">Visite</h2>
            <p class="mkt-results-subtitle">Nessuna visita trovata con i filtri selezionati.</p>
          </header>
        </section>
      `;
      return;
    }

    const cardsHtml = visitsToDisplay.map(visit => {
      return `
        <mkt-visit-card
          data-title="${visit.title}"
          data-desc="${visit.description}"
          data-price="${visit.price}"
          data-image="${getImageUrl(visit.assets, "landscape")}"
          data-duration="${visit.duration}"
          data-visit-id="${visit.id}"
          data-disable-friendly="${visit.disableFriendly}"
          data-verified="${visit.isVerified}" >
        </mkt-visit-card>
      `;
    }).join('\n');

    visitGrid.innerHTML = `
      <section class="mkt-results-section">
        <header class="mkt-results-header">
          <h2 class="mkt-results-title">Visite</h2>
          <p class="mkt-results-subtitle">Visite trovate (${visitsToDisplay.length})</p>
        </header>
        <div class="mkt-results-grid">
          ${cardsHtml}
        </div>
      </section>
    `;
  }

  render() {

    this.innerHTML = `
      <main class="mkt-visit-page-container">
        <header class="mkt-page-header">
          <h1 class="mkt-page-title">Personalizza la tua Visita</h1>
          <p class="mkt-page-subtitle">Raccontaci un po' di te e delle tue passioni, per creare un'esperienza museale su misura per te.</p>
        </header>

        <form class="mkt-form-grid">
          <!-- 1. Museo e Visita -->
          <section class="mkt-card mkt-card-museo">
            <header class="mkt-card-header">
              <h2 class="mkt-card-title">Scegli il museo</h2>
            </header>
            <mkt-input-search-visit id="museum-search"></mkt-input-search-visit>
          </section>

          <!-- 2. Chi Sei -->
          <section class="mkt-card mkt-card-chi-sei">
            <header class="mkt-card-header">
              <h2 class="mkt-card-title">Chi sei?</h2>
            </header>
            <div class="mkt-role-grid">
              <button type="button" class="mkt-role-btn" data-role="Bambino">
                <svg class="mkt-role-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="M371.5-273Q323-306 300-360h360q-23 54-71.5 87T480-240q-60 0-108.5-33Zm-27-161.5Q330-449 330-470t14.5-35.5Q359-520 380-520t35.5 14.5Q430-491 430-470t-14.5 35.5Q401-420 380-420t-35.5-14.5Zm200 0Q530-449 530-470t14.5-35.5Q559-520 580-520t35.5 14.5Q630-491 630-470t-14.5 35.5Q601-420 580-420t-35.5-14.5ZM480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-32 5-62t16-59l80 14q-11 25-16 51.5t-5 55.5q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-16-2-31.5t-5-30.5q-81-9-150-48T485-651l70-41q32 37 72.5 63t88.5 39q-25-39-61.5-68.5T573-704l84-50q83 47 133 129.5T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80ZM200-615l413-155q-32-26-70-39.5T463-823q-95 0-169.5 57.5T200-615Zm-64 110q-7-20-11.5-41t-4.5-43q0-91 51-163t129-112q-2-4-2.5-7.5t-.5-8.5q0-17 11.5-28.5T337-920q14 0 24 8t14 20q22-5 43.5-8t44.5-3q67 0 127.5 26T697-802l122-46 28 75-711 268Zm271-188Z"/>
                </svg>
                Bambino
              </button>
              <button type="button" class="mkt-role-btn" data-role="Studente">
                <svg class="mkt-role-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/>
                </svg>
                Studente
              </button>
              <button type="button" class="mkt-role-btn mkt-chip-active" data-role="Adulto">
                <svg class="mkt-role-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"/>
                </svg>
                Adulto
              </button>
              <button type="button" class="mkt-role-btn" data-role="Specialista">
                <svg class="mkt-role-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="m387-412 35-114-92-74h114l36-112 36 112h114l-93 74 35 114-92-71-93 71ZM240-40v-309q-38-42-59-96t-21-115q0-134 93-227t227-93q134 0 227 93t93 227q0 61-21 115t-59 96v309l-240-80-240 80Zm410-350q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70ZM320-159l160-41 160 41v-124q-35 20-75.5 31.5T480-240q-44 0-84.5-11.5T320-283v124Zm160-62Z"/>
                </svg>
                Specialista
              </button>
            </div>
          </section>

          <!-- 3. Interessi -->
          <section class="mkt-card mkt-card-interessi">
            <header class="mkt-card-header">
              <h2 class="mkt-card-title">I tuoi interessi</h2>
              <div class="mkt-header-actions">
                <span class="mkt-label-muted">Selezione multipla</span>
              </div>
            </header>
            <div class="mkt-chips-group mkt-any-chip-active" id="interessi-group">
              <button type="button" class="mkt-chip mkt-chip-qualsiasi mkt-chip-active" data-value="Qualsiasi">Qualsiasi</button>
            </div>
          </section>

          <!-- 4. Durata -->
          <section class="mkt-card mkt-card-durata">
            <header class="mkt-card-header">
              <h2 class="mkt-card-title">Quanto tempo hai?</h2>
              <strong class="mkt-duration-value">${this.currentDurationStr}</strong>
            </header>
            <div class="mkt-slider-container">
              <span class="mkt-slider-label">1h</span>
              <input type="range" class="mkt-custom-slider" min="1" max="8" step="0.5" id="slider-durata" value="${this.state.durata}">
              <span class="mkt-slider-label">8h+</span>
            </div>
          </section>

          <!-- 5. Opzioni -->
          <section class="mkt-card mkt-card-opzioni">
            <header class="mkt-card-header">
              <h2 class="mkt-card-title">Opzioni aggiuntive</h2>
            </header>
            <div class="mkt-chips-group">
              <button type="button" class="mkt-chip mkt-svg-chip" id="btn-accessibile">
                <svg class="mkt-small-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
                </svg>
                Accessibile
              </button>
              <button type="button" class="mkt-chip mkt-svg-chip mkt-money-chip" id="btn-gratuito">
                <svg class="mkt-small-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="M574-618q-12-30-35.5-47T482-682q-18 0-35 5t-31 19l-58-58q14-14 38-25.5t44-14.5v-84h80v82q45 9 79 36.5t51 71.5l-76 32ZM792-56 608-240q-15 15-41 24.5T520-204v84h-80v-86q-56-14-93.5-51T292-350l80-32q12 42 40.5 72t75.5 30q18 0 33-4.5t29-13.5L56-792l56-56 736 736-56 56Z"/>
                </svg>
                Gratuito
              </button>
              <button type="button" class="mkt-chip mkt-svg-chip mkt-verified-chip" id="btn-verificata">
                <svg class="mkt-small-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                  <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z"/>
                </svg>
                Verificata
              </button>
            </div>
          </section>
        </form>

        <div id="results-container">
        </div>
      </main>
    `;
    this.updateUI();
  }


  setUpEventListenersInterests() {
    const interessiGroup = this.querySelector('#interessi-group');
    if (interessiGroup) {
      interessiGroup.querySelectorAll('.mkt-chip').forEach(chip => {
        chip.addEventListener('click', (e) => this.toggleInterest(e.currentTarget.getAttribute('data-value')));
      });
    }
  }

  setupEventListeners() {
    this.querySelectorAll('.mkt-role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.updateState('chiSei', e.currentTarget.getAttribute('data-role')));
    });

    this.setUpEventListenersInterests()

    const slider = this.querySelector('#slider-durata');
    if (slider) {
      slider.addEventListener('input', (e) => this.updateState('durata', parseFloat(e.target.value)));
    }

    const btnAccessibile = this.querySelector('#btn-accessibile');
    const btnGratuito = this.querySelector('#btn-gratuito');
    const btnVerificata = this.querySelector('#btn-verificata');

    const searchVisitInput = this.querySelector('#search-visit-keyword-input');
    if (searchVisitInput) {
      searchVisitInput.addEventListener('input', (e) => {
        this.updateState('searchQuery', e.target.value);
      });
    }

    if (btnAccessibile) btnAccessibile.addEventListener('click', () => this.updateState('accessibile', !this.state.accessibile));
    if (btnGratuito) btnGratuito.addEventListener('click', () => this.updateState('gratuito', !this.state.gratuito));
    if (btnVerificata) btnVerificata.addEventListener('click', () => this.updateState('verificata', !this.state.verificata));

    const searchComponent = this.querySelector('#museum-search');
    if (searchComponent) {
      searchComponent.addEventListener('museumSelected', async (e) => {
        const id = e.detail;
        this.loadingVisit = true;
        this.state.museumId = id;
        this.state.interessi = [];
        this.partialInterestsList = [];
        this.saveState();
        this.updateGrid();

        try {
          this.allMuseumVisit = await MuseumService.getAllMuseumVisits(id);
          const cats = this.allMuseumVisit?.flatMap(visit => visit.categories || []) || [];
          this.allInterests = [...new Set(cats)].filter(Boolean);
          this.updateGrid();
        } catch (error) {
          console.error("Errore nel recupero delle visite del museo:", error);
          this.allMuseumVisit = [];
          this.allInterests = [];
        } finally {
          this.loadingVisit = false;
          this.updateUI();
        }
      });

      searchComponent.addEventListener('cleared', async () => {
        this.loadingVisit = true;
        this.state.museumId = '';
        this.state.interessi = [];
        this.partialInterestsList = [];
        this.allInterests = [];
        this.saveState();
        this.updateGrid();

        try {
          this.allMuseumVisit = await VisitService.getAllVisits() || [];
        } catch (error) {
          console.error("Errore nel recupero delle visite:", error);
          this.allMuseumVisit = [];
        } finally {
          this.loadingVisit = false;
          this.updateUI();
        }
      });
    }
  }
}
