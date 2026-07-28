import { MuseumController } from '../controllers/museum.controller.js';

export const MuseumRouter = {

    resolve(relativePath, app) {

        const basicMatch = relativePath.match(/^\/?$/);
        if (basicMatch) {
            return MuseumController.render(app);
        }

        const addMuseum = relativePath.match(/^\/add$/);
        if (addMuseum) {
            return MuseumController.renderAdd(app);
        }
    }
}