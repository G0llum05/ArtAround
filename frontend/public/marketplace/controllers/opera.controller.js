import { OperaService } from '../services/opera.service.js';
import { OperaViews } from '../views/opera.js';

export const OperaController = {

  async render(app) {
    try {
      app.container.innerHTML = OperaViews.opera();
    } catch (err) {
      app.container.innerHTML = OperaViews.error(err);
    }
  },

  async renderOne(app, id) {
    app.container.innerHTML = '<p class="mkt-loading">Caricamento...</p>';
    try {
      const opera = await OperaService.getOne(id, app._fetch.bind(app));
      app.container.innerHTML = OperaViews.opera(opera);
    } catch (err) {
      app.container.innerHTML = OperaViews.error(err);
    }
  }
};
