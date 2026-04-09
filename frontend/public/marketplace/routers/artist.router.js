import { ArtistController } from '../controllers/artist.controller.js';

export const ArtistRouter = {

  resolve(relativePath, app) {
      const basicMatch = relativePath.match(/^\/?$/);
      if (basicMatch) {
        return ArtistController.render(app);
      }
  //   const editMatch = path.match(/^\/marketplace\/artists\/([^\/]+)\/edit$/);
  //   if (editMatch) {
  //     const artistId = editMatch[1]; // Estrae l'ID (es. "123")
  //     return ArtistController.renderEdit(app, artistId);
  //   }
  //
  //   const detailMatch = path.match(/^\/marketplace\/artists\/([^\/]+)$/);
  //   if (detailMatch) {
  //     const artistId = detailMatch[1];
  //     return ArtistController.renderDetail(app, artistId);
  //   }
  //
  //   return ArtistController.renderList(app);
  }
};
