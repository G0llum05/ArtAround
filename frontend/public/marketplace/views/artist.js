// public/marketplace/views/artist.js
window.MarketplaceViews = window.MarketplaceViews || {};

window.MarketplaceViews.artist = function (artist) {
  return `
    <div class="mkt-container">
      <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
      <h1 class="mkt-detail__title">${artist.name} ${artist.surname}</h1>
      <p><strong>Correnti:</strong> ${artist.artisticCurrents?.join(', ') || 'N/D'}</p>
    </div>
  `;
};

window.MarketplaceViews.artistAdmin = function (artists) {
  return `
    <div class="mkt-container">
      <div class="mkt-admin-header">
        <h1>Gestione Artisti</h1>
        <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
      </div>

      <div class="mkt-admin-grid">
        <section class="mkt-card mkt-admin-form">
          <h2 id="form-title">Aggiungi Nuovo Artista</h2>
          <form id="artist-form">
            <input type="hidden" id="artist-id">
            <div class="form-group">
              <label>Nome</label>
              <input type="text" id="artist-name" required>
            </div>
            <div class="form-group">
              <label>Cognome</label>
              <input type="text" id="artist-surname" required>
            </div>
            <div class="form-group">
              <label>Correnti (virgola per separare)</label>
              <input type="text" id="artist-currents">
            </div>
            <div class="mkt-form-actions">
              <button type="submit" class="mkt-btn">Salva</button>
              <button type="button" id="cancel-artist-edit" class="mkt-btn mkt-btn--secondary" style="display:none">Annulla</button>
            </div>
          </form>
        </section>

        <section class="mkt-card mkt-admin-list">
          <h2>Artisti Esistenti</h2>
          <div class="mkt-table-wrapper">
            <table class="mkt-table">
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${artists.map(a => `
                  <tr>
                    <td>${a.name} ${a.surname}</td>
                    <td>
                      <button class="mkt-btn-sm edit-artist" data-id="${a._id}">Modifica</button>
                      <button class="mkt-btn-sm delete-artist" data-id="${a._id}">Elimina</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;
};
