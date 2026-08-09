import { ShellStore } from '../shell/shell-store.js';
import { ShellRouter } from '../shell/shell-router.js';
import { Router } from './routers/index.js';

const CSS_ID = 'marketplace-styles';
const CSS_PATH = 'styles/marketplace.css';

export const MarketplaceApp = class MarketplaceApp {

  constructor(container, initialPath) {
    this.container = container;
    this.initialPath = initialPath;
    this._handlers = [];
    this._globals = [];
    this._timers = [];
  }

  mount() {
    if (!document.getElementById(CSS_ID)) {
      const link = document.createElement('link');
      link.id = CSS_ID;
      link.rel = 'stylesheet';
      link.href = CSS_PATH;
      document.head.appendChild(link);
    }

    this._addContainerListener('click', (e) => {
      const a = e.target.closest('[data-navigate]');
      if (a) ShellRouter.navigate(a.dataset.navigate);
    });
    Router.resolve(this.initialPath, this);
  }

  teardown() {
    const cssLink = document.getElementById(CSS_ID);
    if (cssLink) {
      cssLink.remove();
    }

    this._handlers.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    this._globals.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    this._timers.forEach(id => clearInterval(id));
    this.container.innerHTML = '';
    this._handlers = [];
    this._globals = [];
    this._timers = [];
  }

  _addContainerListener(type, fn) {
    this.container.addEventListener(type, fn);
    this._handlers.push({ el: this.container, type, fn });
  }

  _addGlobalListener(el, type, fn) {
    el.addEventListener(type, fn);
    this._globals.push({ el, type, fn });
  }

  _fetch(url, options = {}) {
    const token = ShellStore.get('token');
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }
};

