// public/marketplace/views/artist.js
window.MarketplaceViews = window.MarketplaceViews || {};

window.MarketplaceViews.artist = function (artist) {
  return `
    <div class="mkt-container">
      <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
      <h1 class="mkt-detail__title">${artist.name}</h1>
      <p>${artist.bio || ''}</p>
    </div>
  `;
};
