import { getImageUrl } from '../../services/images.services.js';
import { MuseumService } from "../../services/museum.service.js";

const nomiGiorni = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato"
];

export class MktMuseumHome extends HTMLElement {
  constructor() {
    super();
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];

    this.museumId = id;
    this.museumData = null;
    this.loading = true;
    this.museumVisits = [];
  }

  async connectedCallback() {
    try {
      if (!this.museumId || this.museumId === 'undefined') throw new Error('id undefined')
      this.museumData = await MuseumService.getMuseumById(this.museumId) || [];
      this.museumVisits = await MuseumService.getAllMuseumVisits(this.museumId) || [];
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  formattaOra(time) {
    if (!time) return '';
    const [ora, minuti] = time.split(':');
    const oraNumerica = parseInt(ora, 10); // Rimuove lo zero iniziale (es. "08" diventa 8)
    // Se i minuti sono "00", mostriamo solo l'ora, altrimenti mostriamo anche i minuti
    return minuti === '00' ? `${oraNumerica}` : `${oraNumerica}:${minuti}`;
  }

  formattaSlots(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return "Chiuso";

    return slots.map(slot => {
      const inizio = this.formattaOra(slot.startTime);
      const fine = this.formattaOra(slot.endTime);
      return `${inizio}-${fine}`; // Unisce inizio e fine (es: "8-10")
    }).join(' '); // Unisce i vari slot con uno spazio (es: "8-10 12-18")
  }

  getWeeklyStandard() {
    if (!this.museumData?.openingHours) return [];
    if (Array.isArray(this.museumData.openingHours)) {
      return this.museumData.openingHours[0]?.weeklyStandard || [];
    }
    return this.museumData.openingHours?.weeklyStandard || [];
  }

  getVisitsHtml() {
    return this.museumVisits.map(visit => {
      const imageUrl = getImageUrl(visit?.assets, "landscape");
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
    if (this.loading) {
      this.innerHTML = `<div style="padding: 4rem; text-align: center;">Caricamento dettagli museo...</div>`;
      return;
    }

    this.innerHTML = `
      <main class="mkt-museum-page">

        <!-- HEADER -->
        <header class="mkt-museum-main-header">
          <div class="mkt-museum-title-area">
            <h1 class="mkt-museum-page-title">${this.museumData.name}</h1>
            <div class="mkt-museum-capacity">
              <span class="mkt-capacity-item">
                <strong>Capacità massima:</strong> ${this.museumData.maxCapacity || 'Non conosciuta'}
              </span>
              <span> </span>
              <span class="mkt-capacity-item">
                <strong>Capacità attuale:</strong> ${this.museumData.actualCapacity || 'sconosciuta'}
              </span>
            </div>
          </div>
          ${this.museumData.accessibility.disableFriendly ? `
            <div class="mkt-accessibility-badge">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.1rem" viewBox="0 -960 960 960" width="1.1rem" fill="currentColor">
                 <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
              </svg>
              Accessibile per disabili
            </div>
          ` : ''}
        </header>

        <!-- GRIGLIA UNICA INIZIALE CON GRID-TEMPLATE E GRID-AREA -->
        <section class="mkt-museum-initial-grid">
          <!-- Hero Image -->
          <div class="mkt-hero-area">
            <img src="${getImageUrl(this.museumData.assets, "landscape")}" alt="${this.museumData.name}" class="mkt-museum-hero-img">
          </div>

          <!-- 1. Indirizzo -->
          <article class="mkt-info-card mkt-address-area">
            <div class="mkt-card-header-flex">
              <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)">
                <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-75.5-184.5T480-812q-89 0-164.5 75.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
              </svg>
              <h3 class="mkt-info-card-title">Indirizzo</h3>
            </div>
            <div class="mkt-info-list">
              <div class="mkt-address-single-line" title="${this.museumData.address.street}, ${this.museumData.address.city} (${this.museumData.address.zipCode}), ${this.museumData.address.country}">
                ${this.museumData.address.street}, ${this.museumData.address.city} (${this.museumData.address.zipCode}), ${this.museumData.address.country}
              </div>
            </div>
          </article>

          <!-- 2. Costi Biglietto -->
          <article class="mkt-info-card mkt-tickets-area">
            <h3 class="mkt-info-card-title">Costi Biglietto</h3>
            <div class="mkt-info-list">
              ${this.museumData.ticketInfo.prices.map(p => `
                <div class="mkt-info-row">
                  <span>${p.planName}</span>
                  <strong>${p.target}</strong>
                </div>
              `).join('')}
            </div>
          </article>

          <!-- 3. Orari -->
          <article class="mkt-info-card mkt-hours-area">
            <h3 class="mkt-info-card-title">Orari</h3>
            <div class="mkt-info-list">
              ${(() => {
                const weekly = this.getWeeklyStandard();
                if (!weekly || weekly.length === 0) return '<div class="mkt-info-row"><span>Sconosciuti</span></div>';
                return weekly.map(o => `
                  <div class="mkt-info-row">
                    <span>${nomiGiorni[o.day]}</span>
                    <span>${o?.closed ? 'Chiuso' : this.formattaSlots(o.slots)}</span>
                  </div>
                `).join('');
              })()}
            </div>
          </article>

          <!-- 4. Servizi -->
          <article class="mkt-info-card mkt-services-area">
            <h3 class="mkt-info-card-title">Servizi</h3>
            <div class="mkt-services-grid-sidebar">
              ${this.museumData.services?.hasToilette ? `<div class="mkt-service-item">Servizi igienici</div>` : ''}
              ${this.museumData.services?.hasElevator ? `<div class="mkt-service-item">Ascensori</div>` : ''}
              ${this.museumData.services?.hasAudioGuide ? `<div class="mkt-service-item">Audioguide</div>` : ''}
              ${this.museumData.services?.hasBar ? `<div class="mkt-service-item">Bar / Ristorante</div>` : ''}
              ${this.museumData.services?.hasWifi ? `<div class="mkt-service-item">Wi-Fi gratuito</div>` : ''}
              ${this.museumData.services?.hasCloakroom ? `<div class="mkt-service-item">Guardaroba</div>` : ''}
            </div>
          </article>

          <!-- 5. Descrizione e Contatti -->
          <article class="mkt-detail-card mkt-desc-area">
            <h2 class="mkt-section-title">Descrizione</h2>
            <p class="mkt-desc-text">${this.museumData.description}</p>
            <div class="mkt-contact-list">
              ${this.museumData.contact?.phone ? `
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5T524-281l98-97q9-9 19-11.5t27-1.5l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z"/>
                </svg>
                <a href="tel:${this.museumData.contact.phone}"><span>${this.museumData.contact.phone}</span></a>
              </div>
              ` : ''}
              ${this.museumData.contact?.email ? `
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
                </svg>
                <a href="mailto:${this.museumData.contact.email}"><span>${this.museumData.contact.email}</span></a>
              </div>
              ` : ''}
              ${this.museumData.contact?.website ? `
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                   <path xmlns="http://www.w3.org/2000/svg" d="M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480.5-880t155 31.5q72.5 31.5 127 86t86 127Q880-563 880-480.5T848.5-325q-31.5 73-86 127.5t-127 86Q563-80 480.5-80T325-111.5ZM480-162q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z"/>
                </svg>
                <a href="${this.museumData.contact.website}"><span>${this.museumData.contact.website}</span></a>
              </div>
              ` : ''}
            </div>
          </article>

          <!-- 6. Accessibilità -->
          <article class="mkt-detail-card mkt-accessibility-area">
            <h2 class="mkt-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 -960 960 960" width="1.25rem" fill="currentColor">
                <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
              </svg>
              Accessibilità
            </h2>
            <ul class="mkt-check-list">
              ${this.museumData.accessibility?.wheelchairAccessible ? `
                <li class="mkt-check-item">
                  Accessibile in sedia a rotelle
                </li>` : ''}
              ${this.museumData.accessibility?.childFriendly ? `
                <li class="mkt-check-item">
                  Adatto ai bambini
                </li>` : ''}
              ${this.museumData.accessibility?.tactilePaths ? `
                <li class="mkt-check-item">
                  Percorsi tattili inclusi
                </li>` : ''}
              ${this.museumData.accessibility?.brailleSignage ? `
                <li class="mkt-check-item">
                  Segnaletica in Braille disponibile
                </li>` : ''}
            </ul>
          </article>
        </section>

        <!-- le classi css sono definite in home.css -->
        <section class="mkt-category-section">
          <h2 class="mkt-category-title">Visite del Museo</h2>
          <div class="mkt-horizontal-track" id="mkt-top10-visits-track">
               ${this.getVisitsHtml()}
          </div>
        </section>
      </main>
    `;
  }
}
