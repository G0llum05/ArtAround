window.ShellRouter = (function () {

  let vanillaApp = null;

  // Navigazione
  function navigate(path) {
    history.pushState({}, '', path);
    if (window.ShellStore) {
      window.ShellStore.set('currentPath', path);
    }
    dispatch(path);
  }

  function dispatch(path) {
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

    vanillaApp = new window.MarketplaceApp(
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
  document.addEventListener('DOMContentLoaded', function () {
    dispatch(location.pathname);
  });

  return { navigate };
})();
