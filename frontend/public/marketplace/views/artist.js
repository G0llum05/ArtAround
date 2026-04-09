export const ArtistViews = {
  artist() {
    return `
      <div class="mkt-container">
        <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
      </div>
    `;
  },

  error(err) {
    return `<div class="mkt-error">Errore: ${err.message}</div>`;
   }
};
