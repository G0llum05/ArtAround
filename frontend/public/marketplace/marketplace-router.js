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
    const artistAdminMatch = path.match(/^\/marketplace\/artists$/);
    const operaMatch  = path.match(/^\/marketplace\/opera(\/|$)/);
    const artistMatch = path.match(/^\/marketplace\/artist\/([^/]+)$/);

    if (artistAdminMatch) return this.renderArtistAdmin();
    if (operaMatch)       return this.renderOpera();
    if (artistMatch)      return this.renderArtist(artistMatch[1]);
    return this.renderHome();
  }

  async renderArtistAdmin() {
    this.container.innerHTML = '<p class="mkt-loading">Caricamento artisti...</p>';
    try {
      const res = await this._fetch('/api/artist');
      const artists = await res.json();
      this.container.innerHTML = window.MarketplaceViews.artistAdmin(artists);

      // Gestione Form
      const form = document.getElementById('artist-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('artist-id').value;
        const payload = {
          name: document.getElementById('artist-name').value,
          surname: document.getElementById('artist-surname').value,
          artisticCurrents: document.getElementById('artist-currents').value.split(',').map(s => s.trim()).filter(s => s)
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/artist/${id}` : '/api/artist';

        await this._fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        this.renderArtistAdmin(); // Refresh
      });

      // Edit e Delete
      this.container.querySelectorAll('.edit-artist').forEach(btn => {
        btn.addEventListener('click', () => {
          const artist = artists.find(a => a._id === btn.dataset.id);
          document.getElementById('artist-id').value = artist._id;
          document.getElementById('artist-name').value = artist.name;
          document.getElementById('artist-surname').value = artist.surname;
          document.getElementById('artist-currents').value = artist.artisticCurrents?.join(', ') || '';
          document.getElementById('form-title').innerText = 'Modifica Artista';
          document.getElementById('cancel-artist-edit').style.display = 'inline-block';
        });
      });

      this.container.querySelectorAll('.delete-artist').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Eliminare questo artista?')) {
            await this._fetch(`/api/artist/${btn.dataset.id}`, { method: 'DELETE' });
            this.renderArtistAdmin();
          }
        });
      });

      document.getElementById('cancel-artist-edit')?.addEventListener('click', () => this.renderArtistAdmin());

    } catch (err) {
      this.container.innerHTML = window.MarketplaceViews.error(err);
    }
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

  async renderOpera() {
    console.log('Rendering opera with id:');
    try {
      this.container.innerHTML = window.MarketplaceViews.opera();
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
