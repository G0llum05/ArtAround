import {MuseumService} from "../../services/museum.service.js";

export class MktMuseumHome extends HTMLElement {
  constructor() {
    super();
    this.museumId = null;
    this.museumData = null;
    this.loading = true;
  }

  connectedCallback() {
    this.museumId = this.getAttribute('data-museum-id');
    this.loadMuseumData();
  }

  async loadMuseumData() {
    this.loading = true;
    this.render();

    try {
      this.museumData = await MuseumService.getMuseumById(this.museumId);
    }
    catch(error) {
      this.museumData = {
        name: "The National Gallery",
        maxCapacity: 5000,
        actualCapacity: 1240,
        address: {
          street: "Trafalgar Square",
          city: "London",
          zipCode: "WC2N 5DN",
          country: "United Kingdom"
        },
        contact: {
          phone: "+44 20 7747 2885",
          email: "info@nationalgallery.org.uk",
          website: "nationalgallery.org.uk"
        },
        ticketInfo: {
          prices: [
            { planName: "Standard Admission", target: "Free" },
            { planName: "Special Exhibitions", target: "£20.00" },
            { planName: "Guided Tour", target: "£15.00" }
          ]
        },
        openingHours: [
          { day: "Mon - Thu", hours: "10:00 - 18:00" },
          { day: "Fri", hours: "10:00 - 21:00" },
          { day: "Sat - Sun", hours: "10:00 - 18:00" }
        ],
        description: "The National Gallery houses one of the greatest collections of paintings in the world. Founded in 1824, the collection now comprises over 2,300 works spanning from the mid-13th century to 1900.",
        accessibility: {
          disableFriendly: true,
          wheelchairAccessible: true,
          childFriendly: true,
          tactilePaths: true,
          brailleSignage: true
        },
        services: {
          hasToilette: true,
          hasElevator: true,
          hasAudioGuide: true,
          hasBar: true,
          hasWifi: true,
          hasCloakroom: true
        },
        artworks: [
          { title: "The Fighting Temeraire", image: "/assets/images/place_holder.jpg", author: "J.M.W. Turner, 1839" },
          { title: "Sunflowers", image: "/assets/images/place_holder.jpg", author: "Vincent van Gogh, 1888" },
          { title: "Bathers at Asnières", image: "/assets/images/place_holder.jpg", author: "Georges Seurat, 1884" },
          { title: "The Arnolfini Portrait", image: "/assets/images/place_holder.jpg", author: "Jan van Eyck, 1434" }
        ]
      };
      console.error("Errore nel caricamento del museo:", error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  render() {
    if (this.loading) {
      this.innerHTML = `<div style="padding: 4rem; text-align: center;">Caricamento dettagli museo...</div>`;
      return;
    }

    const d = this.museumData;

    this.innerHTML = `
      <main class="mkt-museum-page">

        <!-- HEADER -->
        <header class="mkt-museum-main-header">
          <div class="mkt-museum-title-area">
            <h1 class="mkt-museum-page-title">${d.name}</h1>
            <div class="mkt-museum-capacity">
              <span class="mkt-capacity-item">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M400-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM80-160v-112q0-33 17-60.5T144-378q55-27 112-40.5T360-432q10 0 20 .5t20 1.5q-32 29-51 69.5T320-272v112H80Zm520 0v-112q0-34-17.5-62.5T528-378q-9-5-18.5-8t-19.5-3q-6 0-12 .5t-12 1.5q25 24 38.5 56T540-304v96h240v-80q0-22-10-41t-28-31q19-11 36.5-25.5T798-384q17 15 27 34.5t10 41.5v96H600Z"/>
                </svg>
                Max: ${d.maxCapacity}
              </span>
              <span>•</span>
              <span class="mkt-capacity-item">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-75.5-184.5T480-812q-89 0-164.5 75.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
                </svg>
                Actual: ${d.actualCapacity}
              </span>
            </div>
          </div>
          ${d.accessibility.disableFriendly ? `
            <div class="mkt-accessibility-badge">
              <svg xmlns="http://www.w3.org/2000/svg" height="1.1rem" viewBox="0 -960 960 960" width="1.1rem" fill="currentColor">
                <path d="M423.5-743.5Q400-767 400-800t23.5-56.5Q447-880 480-880t56.5 23.5Q560-833 560-800t-23.5 56.5Q513-720 480-720t-56.5-23.5ZM680-80v-200H480q-33 0-56.5-23.5T400-360v-240q0-33 23.5-56.5T480-680q24 0 41.5 10.5T559-636q55 66 99.5 90.5T760-520v80q-53 0-107-23t-93-55v138h120q33 0 56.5 23.5T760-300v220h-80Zm-280 0q-83 0-141.5-58.5T200-280q0-72 45.5-127T360-476v82q-35 14-57.5 44.5T280-280q0 50 35 85t85 35q39 0 69.5-22.5T514-240h82q-14 69-69 114.5T400-80Z"/>
              </svg>
              Disable Friendly
            </div>
          ` : ''}
        </header>

        <!-- GRIGLIA UNICA INIZIALE CON GRID-TEMPLATE E GRID-AREA -->
        <section class="mkt-museum-initial-grid">

          <!-- Hero Image -->
          <div class="mkt-hero-area">
            <img src="/assets/images/place_holder.jpg" alt="${d.name}" class="mkt-museum-hero-img">
          </div>

          <!-- 1. Indirizzo -->
          <article class="mkt-info-card mkt-address-area">
            <div class="mkt-card-header-flex">
              <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)">
                <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-75.5-184.5T480-812q-89 0-164.5 75.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
              </svg>
              <h3 class="mkt-info-card-title">Address</h3>
            </div>
            <div class="mkt-info-list">
              <div class="mkt-address-single-line" title="${d.address.street}, ${d.address.city} (${d.address.zipCode}), ${d.address.country}">
                ${d.address.street}, ${d.address.city} (${d.address.zipCode}), ${d.address.country}
              </div>
            </div>
          </article>

          <!-- 2. Costi Biglietto -->
          <article class="mkt-info-card mkt-tickets-area">
            <h3 class="mkt-info-card-title">Costi Biglietto</h3>
            <div class="mkt-info-list">
              ${d.ticketInfo.prices.map(p => `
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
              ${d.openingHours.map(o => `
                <div class="mkt-info-row">
                  <span>${o.day}</span>
                  <span>${o.hours}</span>
                </div>
              `).join('')}
            </div>
          </article>

          <!-- 4. Servizi -->
          <article class="mkt-info-card mkt-services-area">
            <h3 class="mkt-info-card-title">Servizi</h3>
            <div class="mkt-services-grid-sidebar">
              ${d.services.hasToilette ? `<div class="mkt-service-item">Toilets</div>` : ''}
              ${d.services.hasElevator ? `<div class="mkt-service-item">Elevators</div>` : ''}
              ${d.services.hasAudioGuide ? `<div class="mkt-service-item">Audio Guides</div>` : ''}
              ${d.services.hasBar ? `<div class="mkt-service-item">Cafe/Rest.</div>` : ''}
              ${d.services.hasWifi ? `<div class="mkt-service-item">Free Wi-Fi</div>` : ''}
              ${d.services.hasCloakroom ? `<div class="mkt-service-item">Cloakroom</div>` : ''}
            </div>
          </article>

          <!-- 5. Descrizione e Contatti -->
          <article class="mkt-detail-card mkt-desc-area">
            <h2 class="mkt-section-title">Descrizione</h2>
            <p class="mkt-desc-text">${d.description}</p>
            <div class="mkt-contact-list">
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5T524-281l98-97q9-9 19-11.5t27-1.5l140 26q13 2 22.5 13t9.5 25v162q0-18-12 30-30 12Z"/>
                </svg>
                <span>${d.contact.phone}</span>
              </div>
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
                </svg>
                <span>${d.contact.email}</span>
              </div>
              <div class="mkt-contact-row">
                <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                  <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82q-70-14-124-61.5T230-330h86q11 31 33.5 55.5T395-230h-75Zm160 0q35-21 57.5-45.5T544-330h86q-34 57-88 104.5T440-162Zm-240-208h-94q-4-26-4-50t4-50h94q-2 24-2 50t2 50Zm136 0h168q2-24 2-50t-2-50H336q-2 24-2 50t2 50Zm208 0h94q4-26 4-50t-4-50h-94q2 24 2 50t-2 50ZM324-420h-86q13-58 45.5-104.5T360-598q-22 25-33.5 55.5T324-420Zm116 0h160q-11-31-33.5-55.5T480-505q-27 24-39.5 54.5T430-420Zm206 0h86q-13-58-45.5-104.5T600-598q22 25 33.5 55.5T636-420ZM240-630h76q21-39 50-71.5T426-752q-57 14-101 51.5T240-630Zm398 0h76q-37-43-81-80.5T534-752q38 29 67 61.5T638-630Z"/>
                </svg>
                <span>${d.contact.website}</span>
              </div>
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
              ${d.accessibility.wheelchairAccessible ? `
                <li class="mkt-check-item">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                  Fully wheelchair accessible
                </li>` : ''}
              ${d.accessibility.childFriendly ? `
                <li class="mkt-check-item">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                  Child friendly environment
                </li>` : ''}
              ${d.accessibility.tactilePaths ? `
                <li class="mkt-check-item">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                  Tactile paths included
                </li>` : ''}
              ${d.accessibility.brailleSignage ? `
                <li class="mkt-check-item">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="var(--primary)"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                  Braille signage available
                </li>` : ''}
            </ul>
          </article>

        </section>

        <!-- OPERE -->
        <section class="mkt-content-section">
          <div class="mkt-section-header-row">
            <h2 class="mkt-section-heading">Tutte le Opere</h2>
          </div>
          <div class="mkt-cards-grid-4">
            ${d.artworks.map(art => `
              <article class="mkt-info-card" style="padding: 0.75rem; gap: 0.5rem;">
                <div style="height: 12rem; border-radius: 8px; overflow: hidden;">
                  <img src="${art.image}" alt="${art.title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${art.title}</h4>
                <p style="margin: 0; font-size: 0.8rem; color: var(--on-surface-variant);">${art.author}</p>
              </article>
            `).join('')}
          </div>
        </section>

      </main>
    `;
  }
}
