import { HomeController } from '../controllers/home.controller.js';

export const HomeRouter = {
  resolve(relativePath, app) {
      const basicMatch = relativePath.match(/^\/?$/);
      if (basicMatch) {
        return HomeController.render(app);
      }
  }
};
