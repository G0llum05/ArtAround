import { ArtworkController } from '../controllers/artwork.controller.js';

export const ArtworkRouter = {
  resolve(relativePath, app) {
      const basicMatch = relativePath.match(/^\/?$/);
      if (basicMatch) {
        return ArtworkController.render(app);
      }
  }
};
