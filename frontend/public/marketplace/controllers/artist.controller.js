import { ArtistService } from '../services/artist.service.js';
import { ArtistViews } from '../views/artist.js';

export const ArtistController = {

  async render(app) {
    try {
      app.container.innerHTML = ArtistViews.artist();
    } catch (err) {
      app.container.innerHTML = ArtistViews.error(err);
    }
  }
};
