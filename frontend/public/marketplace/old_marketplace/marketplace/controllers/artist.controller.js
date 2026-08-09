import { ArtistService } from '../services/artist.service.js';
import { ArtistViews } from '../views/artist.js';

export const ArtistController = {

  async render(app) {
    app.container.innerHTML = '<p class="mkt-loading">Caricamento artisti...</p>';
    try {
      const artists = await ArtistService.getAll(app._fetch.bind(app));
      app.container.innerHTML = ArtistViews.artist(artists);
    } catch (err) {
      app.container.innerHTML = ArtistViews.error(err);
    }
  },

  async renderAdd(app) {
    try {
      app.container.innerHTML = ArtistViews.add();
      
      const form = app.container.querySelector('#add-artist-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const name = formData.get('name');
        const surname = formData.get('surname');
        const artisticCurrentsStr = formData.get('artisticCurrents');
        const artworksStr = formData.get('artworks');
        const followerOfStr = formData.get('followerOf');
        const teacherOfStr = formData.get('teacherOf');
        
        const parseList = (str) => str ? str.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

        const payload = {
          name,
          surname,
          artisticCurrents: parseList(artisticCurrentsStr),
          artworks: parseList(artworksStr),
          followerOf: parseList(followerOfStr),
          teacherOf: parseList(teacherOfStr)
        };

        try {
          const response = await ArtistService.create(payload, app._fetch.bind(app));
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Errore nella creazione dell\'artista');
          }
          
          // Se va bene, torniamo alla lista artisti (o dove preferisci)
          const { ShellRouter } = await import('../../shell/shell-router.js');
          ShellRouter.navigate('/marketplace/artists');
        } catch (err) {
          alert(`Errore: ${err.message}`);
        }
      });

    } catch (err) {
      app.container.innerHTML = ArtistViews.error(err);
    }
  }
};
