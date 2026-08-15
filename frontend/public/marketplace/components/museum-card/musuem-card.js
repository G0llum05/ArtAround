// public/marketplace/components/museum-card/museum-card.js

export class MktMuseumCard extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const title = this.getAttribute('data-title') || 'Museo';
    const city = this.getAttribute('data-city') || '';
    const desc = this.getAttribute('data-desc') || '';
    const image = this.getAttribute('data-image') || '/assets/images/place_holder.jpg';

    // Struttura HTML fedele a quella di Angular
    this.innerHTML = `
      <article class="mkt-museum-card-container">
        <div class="mkt-museum-image-wrapper">
          <img alt="${title}" src="${image}" class="mkt-museum-img">
        </div>

        <div class="mkt-museum-content">
          <header class="mkt-museum-header">
            <h3 class="mkt-museum-title">${title}</h3>
            <span class="mkt-museum-city">
              <svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor">
                <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-75.5-184.5T480-812q-89 0-164.5 75.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/>
              </svg>
              ${city}
            </span>
          </header>
          <p class="mkt-museum-desc">${desc}</p>
        </div>
      </article>
    `;
  }
}
