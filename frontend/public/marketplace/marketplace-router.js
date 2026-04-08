window.MarketplaceApp = class MarketplaceApp {

  constructor(container, initialPath) {
    this.container = container;
    this.initialPath = initialPath;
    this._handlers = [];   // listener sul container
    this._globals = [];    // listener su document/window
    this._timers = [];
  }

  // Mount
  mount() {
    this._addContainerListener('click', (e) => {
      const a = e.target.closest('[data-navigate]');
      if (a) ShellRouter.navigate(a.dataset.navigate);
    });

    this.renderPath(this.initialPath);
  }

  // Routing interno
  renderPath(path) {
    // /marketplace              → lista opere
    // /marketplace/opera/:id   → dettaglio opera
    // /marketplace/artist/:id  → dettaglio artista

    const operaMatch  = path.match(/^\/marketplace\/opera\/([^/]+)$/);
    const artistMatch = path.match(/^\/marketplace\/artist\/([^/]+)$/);

    if (operaMatch)       return this.renderOpera(operaMatch[1]);
    if (artistMatch)      return this.renderArtist(artistMatch[1]);
    return this.renderHome();
  }

  // Views
  async renderHome() {
    try {
      this.container.innerHTML = window.MarketplaceViews.home();
    } catch (err) {
      this.container.innerHTML = window.MarketplaceViews.error(err);
      console.error('Errore durante il fetch delle opere:', err);
    }
  }

  async renderOpera(id) {
    this.container.innerHTML = '<p class="mkt-loading">Caricamento...</p>';
    try {
      const res   = await this._fetch(`/api/opera/${id}`);
      const opera = await res.json();
      this.container.innerHTML = window.MarketplaceViews.opera(opera);
    } catch (err) {
      this.container.innerHTML = window.MarketplaceViews.error(err);
    }
  }

  async renderArtist(id) {
    this.container.innerHTML = '<p class="mkt-loading">Caricamento...</p>';
    try {
      const res    = await this._fetch(`/api/artist/${id}`);
      const artist = await res.json();
      this.container.innerHTML = window.MarketplaceViews.artist(artist);
    } catch (err) {
      this.container.innerHTML = window.MarketplaceViews.error(err);
    }
  }

  // Teardown
  teardown() {
    // Rimuovi listener sul container
    this._handlers.forEach(({ el, type, fn }) =>
      el.removeEventListener(type, fn)
    );
    // Rimuovi listener globali
    this._globals.forEach(({ el, type, fn }) =>
      el.removeEventListener(type, fn)
    );
    // Cancella timer
    this._timers.forEach(id => clearInterval(id));

    this.container.innerHTML = '';
    this._handlers = [];
    this._globals  = [];
    this._timers   = [];
  }

  // Helpers
  _addContainerListener(type, fn) {
    this.container.addEventListener(type, fn);
    this._handlers.push({ el: this.container, type, fn });
  }

  _addGlobalListener(el, type, fn) {
    el.addEventListener(type, fn);
    this._globals.push({ el, type, fn });
  }

  _fetch(url) {
    const token = ShellStore.get('token');
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
};
