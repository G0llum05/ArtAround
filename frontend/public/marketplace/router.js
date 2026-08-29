export function goTo(btn, route, id) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/search/') && !currentPath.includes('/preview/')) {
        sessionStorage.setItem('mkt_return_route', currentPath);
      }
    } catch (err) {}

    let payload = {
      destination: route,
    };

    if (id) payload.id = id;

    const navEvent = new CustomEvent('angular-navigate', {
      detail: payload,
      bubbles: true,
      composed: true, //"buca" lo shadowDOM
    });
    btn.dispatchEvent(navEvent);
  });
}


export class MktRouter extends HTMLElement {
  static get observedAttributes() {
    return ['route', 'user-id', 'user-role'];
  }

  constructor() {
    super();
    this.routes = window.location.pathname;
    this.userId = null;
    this.userRole = null;
    this.currentRenderedRoute = null;
  }

  connectedCallback() {
    const rawUserId = this.getAttribute('user-id');
    this.userId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined') ? rawUserId : null;

    const rawUserRole = this.getAttribute('user-role');
    this.userRole = (rawUserRole && rawUserRole !== 'null' && rawUserRole !== 'undefined') ? rawUserRole : null;

    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'route') {
      this.render();
    } else if (name === 'user-id') {
      this.userId = (newValue && newValue !== 'null' && newValue !== 'undefined') ? newValue : null;
      const visitEditor = this.querySelector('mkt-visit-editor');
      if (visitEditor) {
        if (this.userId) {
          visitEditor.setAttribute('data-user-id', this.userId);
        } else {
          visitEditor.removeAttribute('data-user-id');
        }
      }
      const visitPreview = this.querySelector('mkt-visit-preview');
      if (visitPreview) {
        if (this.userId) {
          visitPreview.setAttribute('data-user-id', this.userId);
        } else {
          visitPreview.removeAttribute('data-user-id');
        }
      }
    } else if (name === 'user-role') {
      this.userRole = (newValue && newValue !== 'null' && newValue !== 'undefined') ? newValue : null;
      const visitPreview = this.querySelector('mkt-visit-preview');
      if (visitPreview) {
        if (this.userRole) {
          visitPreview.setAttribute('data-user-role', this.userRole);
        } else {
          visitPreview.removeAttribute('data-user-role');
        }
      }
    }
  }

  render() {
    const rawRoute = this.getAttribute('route') || window.location.pathname;
    const cleanRoute = rawRoute.split('?')[0].replace(/\/+$/, '') || '/marketplace';

    // non rieseguo il render se la rotta è la stessa (previene il doppio caricamento)
    if (this.currentRenderedRoute === cleanRoute && this.innerHTML.trim() !== '') return;
    this.currentRenderedRoute = cleanRoute;

    this.routes = cleanRoute;
    this.innerHTML = `<link rel="stylesheet" href="/marketplace/marketplace.registry.css"/>\n`;

    // Salva la rotta di navigazione principale per permettere al tasto "Indietro" di tornare alla pagina giusta
    if (cleanRoute === '/marketplace' || cleanRoute === '/marketplace/visit/search' || cleanRoute.startsWith('/marketplace/museum/')) {
      try {
        sessionStorage.setItem('mkt_return_route', cleanRoute);
      } catch (e) {}
    }

    // Questa RegExp cerca esattamente /marketplace/museum/ seguito da qualsiasi cosa non contenga "/"
    const museumDetailRegex = /^\/marketplace\/museum\/([^/]+)$/;
    const matchMuseumId = this.routes.match(museumDetailRegex);
    if (matchMuseumId) {
      const visitId = matchMuseumId[1];
      this.innerHTML += `<mkt-museum-home data-visit-id="${visitId}"></mkt-museum-home>`;
      return;
    }

    // Questa RegExp cerca esattamente /marketplace/visit/ seguito da qualsiasi cosa non contenga "/"
    const visitDetailRegex = /^\/marketplace\/visit\/search\/([^/]+)$/;
    const matchVisitId = this.routes.match(visitDetailRegex);
    if (matchVisitId) {
      const visitId = matchVisitId[1];
      this.innerHTML += `<mkt-visit-preview data-visit-id="${visitId}" data-user-id="${this.userId || ''}" data-user-role="${this.userRole || ''}"></mkt-visit-preview>`;
      return;
    }

    switch (this.routes) {
      case '/marketplace':
        this.innerHTML += `<mkt-home> </mkt-home>`;
        break;
      case '/marketplace/visit/create':
        this.innerHTML += `<mkt-visit-editor ${this.userId ? `data-user-id="${this.userId}"` : ''}> </mkt-visit-editor>`;
        break;
      case '/marketplace/visit/search':
        this.innerHTML += `<mkt-visit-explorer> </mkt-visit-explorer>`;
        break;
      default:
        this.innerHTML = ``;
        window.history.replaceState(null, '', '/marketplace');
        const payload = {
          destination: 'page-not-found',
        };
        const navEvent = new CustomEvent('angular-navigate', {
          detail: payload,
          bubbles: true,
          composed: true // Buca lo Shadow DOM (o i confini del Web Component)
        });
        this.dispatchEvent(navEvent);
        break;
    }
  }
}
