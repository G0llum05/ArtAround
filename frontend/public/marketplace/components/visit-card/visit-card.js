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
    const price = this.getAttribute('data-price')==0 ? `Gratis` : `€ ${this.getAttribute('data-price')}`;
    const desc = this.getAttribute('data-desc') || '';
    const image = this.getAttribute('data-image') || '/assets/images/place_holder.jpg';
    const duration = `${this.getAttribute('data-duration')  || ''} m`;

    let tagsHtml = '';
    if (duration) {
      tagsHtml = `
        <footer class="mkt-visit-tags">
          <span class="mkt-tag mkt-accent">${duration}</span>
        </footer>
      `;
    }

    this.innerHTML = `
      <article class="mkt-visit-card-container" id="visit-card">
        <div class="mkt-visit-image-wrapper">
          <img alt="${title}" src="${image}" class="mkt-visit-img">
        </div>

        <div class="mkt-visit-content">
          <header class="mkt-visit-header">
            <h3 class="mkt-visit-title">${title}</h3>
            <span class="mkt-visit-price">${price}</span>
          </header>

          <p class="mkt-visit-desc">${desc}</p>

          ${tagsHtml}
        </div>
      </article>
    `;
  }

  setUpEventListeners() {
    const card =this.querySelector('#visit-card')
    if(card){
      if(this.id && this.id!='null' && this.id!='undefined'){
        goTo(card, `/marketplace/visit/search/${this.id}`)
      }
    }
  }
}
