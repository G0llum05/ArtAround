// public/marketplace/views/home.js
window.MarketplaceViews = window.MarketplaceViews || {};

window.MarketplaceViews.home = function () {
  return `
    <div class="mkt-container">
      <h1 class="mkt-title">Marketplace</h1>
    </div>
  `;
};

window.MarketplaceViews.error = function (err) {
  return `<div class="mkt-error">Errore: ${err.message}</div>`;
};
