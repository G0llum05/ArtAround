import { OperaController } from '../controllers/opera.controller.js';

export const OperaRouter = {
  resolve(relativePath, app) {
      const basicMatch = relativePath.match(/^\/?$/);
      if (basicMatch) {
        return OperaController.render(app);
      }
  }
};
