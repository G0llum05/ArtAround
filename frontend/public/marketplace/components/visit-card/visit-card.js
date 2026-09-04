import { goTo } from '../../router.js';

export class MktVisitCard extends HTMLElement {
  constructor() {
    super();
    this.id = '';
  }

  connectedCallback() {
    this.id = this.getAttribute('data-visit-id') || '';
    this.render();
    this.setUpEventListeners();
  }

  render() {
    const title = this.getAttribute('data-title') || 'Visita Guidata';
    const price = this.getAttribute('data-price')==="0" ? `Gratis` : `€ ${this.getAttribute('data-price')}`;
    const desc = this.getAttribute('data-desc');
    const image = this.getAttribute('data-image') === "undefined" ? '/assets/images/place_holder.jpg' : this.getAttribute('data-image');

    const isDisableFriendly = this.getAttribute('data-disable-friendly');
    const isVerified = this.getAttribute('data-verified');
    const isFree = price === 'Gratis';
    const duration = `${this.getAttribute('data-duration')  || ''} `;

    function formattedDuration(input) {
      // Estrae il numero dall'input, ignorando lettere come "m"
      const minutiTotali = parseInt(input, 10);
      if (isNaN(minutiTotali)) {
        return "Sconosciuta";
      }
      const ore = Math.floor(minutiTotali / 60);
      const minutiRimanenti = minutiTotali % 60;

      if (ore === 0) return `${minutiRimanenti}m`;
      if (minutiRimanenti === 0) return `${ore}h`;

      return `${ore}h ${minutiRimanenti}m`;
    }

    this.innerHTML = `
      <article class="mkt-visit-card-container" id="visit-card">
        <div class="mkt-visit-image-wrapper">
          <img alt="${title}" src="${image}" class="mkt-visit-img">
        </div>

      <mkt-badges-list disable-friendly='${isDisableFriendly}' free='${isFree}' verified='${isVerified}' "></mkt-badges-list>

        <div class="mkt-visit-content">
          <header class="mkt-visit-header">
            <h3 class="mkt-visit-title">${title}</h3>
            <span class="mkt-visit-price">${price}</span>
          </header>

          <p class="mkt-visit-desc">${desc}</p>

          <footer class="mkt-visit-tags">
            <span class="mkt-tag mkt-accent">${formattedDuration(duration)}</span>
          </footer>
        </div>
      </article>
    `;
  }

  setUpEventListeners() {
    const card = this.querySelector('#visit-card')
    if (card){
      if(this.id && this.id!='null' && this.id!='undefined'){
        goTo(card, `/marketplace/visit/search/${this.id}`)
      }
    }
  }
}
