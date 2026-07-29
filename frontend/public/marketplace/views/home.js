export const HomeViews = {
  home() {
    return `
        <div class="mkt-container">
        </div>
      `;
  },

  error(err) {
    return `<div class="mkt-error">Errore: ${err.message}</div>`;
  }
};
