// public/marketplace/views/opera.js
window.MarketplaceViews = window.MarketplaceViews || {};

window.MarketplaceViews.opera = function (opera) {
  return `
    <div class="mkt-container">
      <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
      <div class="mkt-detail">
        <img class="mkt-detail__img" src="/images/${opera.image}" alt="${opera.title}">
        <div class="mkt-detail__info">
          <h1 class="mkt-detail__title">${opera.title}</h1>
          <p class="mkt-detail__desc">${opera.details?.description || ''}</p>
          <a class="mkt-link" data-navigate="/marketplace/artist/${opera.artist?._id}">
            Vai all'artista →
          </a>
        </div>
      </div>
    </div>
  `;
};
