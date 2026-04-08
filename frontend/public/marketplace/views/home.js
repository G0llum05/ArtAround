// public/marketplace/views/home.js
window.MarketplaceViews = window.MarketplaceViews || {};

window.MarketplaceViews.home = function () {
  return `
    <div class="mkt-container">
      <h1 class="mkt-title">Marketplace</h1>
      <a class="mkt-link" data-navigate="/marketplace/opera">Vai alla pagina di un'opera</a>
    </div>
  `;
};

window.MarketplaceViews.error = function (err) {
  return `<div class="mkt-error">Errore: ${err.message}</div>`;
};
