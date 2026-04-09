export const HomeViews = {
    home() {
      return `
        <div class="mkt-container">
          <h1 class="mkt-title">Marketplace</h1>
          <a class="mkt-link" data-navigate="/marketplace/opera">Vai alla pagina di un'opera</a>
          <a class="mkt-link" data-navigate="/marketplace/artists">Vai alla pagina degli artisti</a>
        </div>
      `;
    },

    error(err) {
      return `<div class="mkt-error">Errore: ${err.message}</div>`;
    }
  };
