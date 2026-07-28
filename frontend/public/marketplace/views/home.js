export const HomeViews = {
  home() {
    return `
        <div class="mkt-container">
          <h1 class="mkt-title">Marketplace</h1>
          <a class="mkt-link" data-navigate="/marketplace/artwork">Vai alla pagina di un'opera</a><br>
          <a class="mkt-link" data-navigate="/marketplace/artists">Vai alla pagina degli artisti</a><br>
          <a class="mkt-link" data-navigate="/marketplace/museums">Vai alla pagina dei musei</a>
        </div>
      `;
  },

  error(err) {
    return `<div class="mkt-error">Errore: ${err.message}</div>`;
  }
};
