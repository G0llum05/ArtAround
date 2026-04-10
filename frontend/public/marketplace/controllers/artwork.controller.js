import { ArtworkService } from '../services/artwork.service.js';
import { ArtworkViews } from '../views/artwork.js';

export const ArtworkController = {

  async render(app) {
    try {
      app.container.innerHTML = ArtworkViews.artwork();
    } catch (err) {
      app.container.innerHTML = ArtworkViews.error(err);
    }
  },

  async renderOne(app, id) {
    app.container.innerHTML = '<p class="mkt-loading">Caricamento...</p>';
    try {
      const artwork = await ArtworkService.getOne(id, app._fetch.bind(app));
      app.container.innerHTML = ArtworkViews.artwork(artwork);
    } catch (err) {
      app.container.innerHTML = ArtworkViews.error(err);
    }
  }
};
