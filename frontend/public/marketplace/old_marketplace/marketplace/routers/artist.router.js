import { ArtistController } from '../controllers/artist.controller.js';

export const ArtistRouter = {

  resolve(relativePath, app) {

    const basicMatch = relativePath.match(/^\/?$/);
    if (basicMatch) {
      return ArtistController.render(app);
    }

    const addArtist = relativePath.match(/^\/add$/);
    if (addArtist) {
      return ArtistController.renderAdd(app);
    }
  }
};
