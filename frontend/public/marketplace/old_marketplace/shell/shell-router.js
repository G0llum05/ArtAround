import { ShellStore } from '/shell/shell-store.js';
import { MarketplaceApp } from '../marketplace/app.js';

export const ShellRouter = (function () {

  let vanillaApp = null;

  // Navigazione
  function navigate(path) {
    history.pushState({}, '', path);
    if (ShellStore) {
      ShellStore.set('currentPath', path);
    }
    dispatch(path);
  }

  /**
   * Registro enterprise di autorizzazione ruoli per le rotte della Shell / Micro-frontends.
   * Aggiungere o modificare qui le protezioni per nuove sezioni dell'app.
   */
  const ROUTE_PERMISSIONS = {
    '/marketplace/museums': ['admin'],
    // Esempi di estensioni immediate:
    // '/visite/gestione': ['teacher', 'admin'],
    // '/marketplace/crea': ['museumstaff', 'admin'],
  };

  function checkRoutePermissions(path) {
    const matchedPrefix = Object.keys(ROUTE_PERMISSIONS).find(prefix => path.startsWith(prefix));
    if (!matchedPrefix) return true; // Nessuna restrizione

    const allowedRoles = ROUTE_PERMISSIONS[matchedPrefix];
    const token = ShellStore ? ShellStore.get('token') : null;
    const user = ShellStore ? ShellStore.get('user') : null;

    if (!token) {
      alert('Accesso negato: Devi effettuare il login per accedere a questa sezione.');
      activateAngular('/login?returnUrl=' + encodeURIComponent(path));
      return false;
    }

    if (!user || !allowedRoles.includes(user.role)) {
      alert(`Accesso negato: Questa sezione richiede uno dei seguenti ruoli: [${allowedRoles.join(', ')}].`);
      activateAngular('/');
      return false;
    }

    return true;
  }

  function dispatch(path) {
    if (!checkRoutePermissions(path)) {
      return;
    }

    if (path.startsWith('/marketplace')) {
      activateVanilla(path);
    } else {
      activateAngular(path);
    }
  }

  // attiva Angular
  function activateAngular(path) {
    if (vanillaApp) {
      vanillaApp.teardown();
      vanillaApp = null;
    }

    document.getElementById('vanilla-root').style.display = 'none';
    document.getElementById('angular-root').style.display = 'block';

    // Usa il router Angular interno
    if (window.__angularRouter) {
      window.__angularRouter.navigateByUrl(path);
    }
  }

  // attiva Vanilla
  function activateVanilla(path) {
    document.getElementById('angular-root').style.display = 'none';
    document.getElementById('vanilla-root').style.display = 'block';

    // Smonta la view precedente se esiste
    if (vanillaApp) vanillaApp.teardown();

    vanillaApp = new MarketplaceApp(
      document.getElementById('vanilla-root'),
      path
    );
    vanillaApp.mount();
  }

  // i tutti i click sui link
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a) return;

    const url = new URL(a.href, location.origin);
    if (url.origin !== location.origin) return; // link esterno

    e.preventDefault();
    navigate(url.pathname);
  });

  // Back / Forward del browser
  window.addEventListener('popstate', function () {
    dispatch(location.pathname);
  });

  // Init
  dispatch(location.pathname);

  return { navigate };
})();

// Per esporre su Angular
window.ShellRouter = ShellRouter;
