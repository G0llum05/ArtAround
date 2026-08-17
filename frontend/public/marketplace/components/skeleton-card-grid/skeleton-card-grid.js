export class MktCardGrid extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  getSkeletonHtml() {
    let skeletons = '';
    for (let i = 0; i < 10; i++) {
      skeletons += `
        <div class="mkt-skeleton-card">
          <div class="mkt-skeleton mkt-skeleton-img"></div>
          <div class="mkt-skeleton-content">
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 80%; height: 1.5rem;"></div>
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 60%;"></div>
            <div class="mkt-skeleton mkt-skeleton-text" style="width: 50%;"></div>
          </div>
        </div>
      `;
    }
    return skeletons;
  }

  render() {
    this.innerHTML = `
        <section class="mkt-results-section">
          <div class="mkt-results-grid">
            ${this.getSkeletonHtml()}
          </div>
        </section>
      `;
  }
}
