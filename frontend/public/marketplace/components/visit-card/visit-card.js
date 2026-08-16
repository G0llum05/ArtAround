// public/marketplace/components/visit-card/visit-card.js

export class MktVisitCard extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const title = this.getAttribute('data-title') || 'Visita Guidata';
    const price = this.getAttribute('data-price')==0 ? `Gratis` : `€ ${this.getAttribute('data-price')}`;
    const desc = this.getAttribute('data-desc') || '';
    const image = this.getAttribute('data-image') || '/assets/images/place_holder.jpg';
    const duration = this.getAttribute('data-duration') || '';

    let tagsHtml = '';
    if (duration) {
      tagsHtml = `
        <footer class="mkt-visit-tags">
          <span class="mkt-tag mkt-accent">${duration}</span>
        </footer>
      `;
    }

    this.innerHTML = `
      <article class="mkt-visit-card-container">
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
}
