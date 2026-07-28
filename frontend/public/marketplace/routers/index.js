import { HomeRouter } from './home.router.js';
import { ArtistRouter } from './artist.router.js';
import { ArtworkRouter } from './artwork.router.js';

const routes = [
  {
    prefix: '/marketplace/artists',
    loadRouter: async () => {
      const module = await import('./artist.router.js');
      return module.ArtistRouter;
    }
  },
  {
    prefix: '/marketplace/artwork',
    loadRouter: async () => {
      const module = await import('./artwork.router.js');
      return module.ArtworkRouter;
    }
  },
  {
    prefix: '/marketplace/museums',
    loadRouter: async () => {
      const module = await import('./museum.router.js');
      return module.MuseumRouter;
    }
  },
  {
    default: '/marketplace',
    loadRouter: async () => {
      const module = await import('./home.router.js');
      return module.HomeRouter;
    }
  }
];

export const Router = {
  async resolve(path, app) {
    let route = routes.find(r => path.startsWith(r.prefix));

    if (!route) {
      route = routes.find(r => r.default && path.startsWith(r.default));

    }
    if (!route) {
      console.warn(`No route found for path: ${path}`);
      return;
    }

    const specificRouter = await route.loadRouter();
    const relativePath = path.substring(route.prefix ? route.prefix.length : route.default.length);
    return specificRouter.resolve(relativePath, app);
  }
};
