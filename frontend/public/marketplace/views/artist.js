export const ArtistViews = {
  artist() {
    return `
      <div class="mkt-container">
        <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
        <a class="mkt-link" data-navigate="/marketplace/artists/add">Aggiungi Artista</a>
      </div>
    `;
  },

  add() {
    return `
      <div class="mkt-container">
        <a class="mkt-back" data-navigate="/marketplace/artists">← Torna agli artisti</a>
        <form class="mkt-form" id="add-artist-form">
          <h1 class="mkt-title">Aggiungi Artista</h1>
          
          <div class="mkt-field">
            <label for="name">Nome:</label>
            <input type="text" id="name" name="name" required>
          </div>

          <div class="mkt-field">
            <label for="surname">Cognome:</label>
            <input type="text" id="surname" name="surname" required>
          </div>

          <div class="mkt-field">
            <label for="artisticCurrents">Correnti Artistiche (separate da virgola):</label>
            <input type="text" id="artisticCurrents" name="artisticCurrents">
          </div>

          <div class="mkt-field">
            <label for="artworks">ID Opere (separati da virgola):</label>
            <input type="text" id="artworks" name="artworks">
          </div>

          <div class="mkt-field">
            <label for="followerOf">ID Seguace di (IDs separati da virgola):</label>
            <input type="text" id="followerOf" name="followerOf">
          </div>

          <div class="mkt-field">
            <label for="teacherOf">ID Maestro di (IDs separati da virgola):</label>
            <input type="text" id="teacherOf" name="teacherOf">
          </div>

          <button type="submit" class="mkt-button">Aggiungi</button>
        </form>
      </div>
    `;
  },

  error(err) {
    return `<div class="mkt-error">Errore: ${err.message}</div>`;
   }
};
