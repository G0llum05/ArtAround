import { HomeViews } from '../views/home.js';

export const HomeController = {
  async render(app) {
    try {
      app.container.innerHTML = HomeViews.home();
    } catch (err) {
      app.container.innerHTML = HomeViews.error(err);
    }
  }
};
