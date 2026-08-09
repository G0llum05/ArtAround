import { MuseumController } from '../controllers/museum.controller.js';
import { ShellStore } from '../../shell/shell-store.js';
import { ShellRouter } from '../../shell/shell-router.js';

export const MuseumRouter = {

    resolve(relativePath, app) {
        const token = ShellStore ? ShellStore.get('token') : null;
        const user = ShellStore ? ShellStore.get('user') : null;

        if (!token) {
            alert('Accesso negato: Devi effettuare il login per accedere alla sezione Musei.');
            if (ShellRouter) {
                ShellRouter.navigate('/login?returnUrl=/marketplace/museums');
            } else {
                window.location.href = '../museums';
            }
            return;
        }

        if (!user || user.role !== 'admin') {
            alert('Accesso negato: La sezione Musei è riservata esclusivamente agli utenti Amministratori.');
            if (ShellRouter) {
                ShellRouter.navigate('/');
            } else {
                window.location.href = '/';
            }
            return;
        }

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
