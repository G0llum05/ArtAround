export function goTo(btn, route, id) {
  btn.addEventListener('click', () => {
    let payload = {
      destination: route,
    };

    if (id) payload.id = id;

    const navEvent = new CustomEvent('angular-navigate', {
      detail: payload,
      bubbles: true,
      composed: true, //"buca" lo shadowdom
    })
    btn.dispatchEvent(navEvent);
  });
}


export class MktRouter extends HTMLElement {
  static get observedAttributes() {
    return ['route'];
  }

  constructor() {
    super();
    this.routes = window.location.pathname;
    this.userId = this.getAttribute('user-id')
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'route' && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    this.routes = this.getAttribute('route') || window.location.pathname;
    this.innerHTML = `<link rel="stylesheet" href="/marketplace/marketplace.registry.css"/>\n`

    // Questa RegExp cerca esattamente /marketplace/visit/ seguito da qualsiasi cosa non contenga "/"
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
      this.innerHTML += `<mkt-visit-preview data-visit-id="${visitId}"></mkt-visit-preview>`;
      return;
    }

    switch (this.routes) {
      case '/marketplace':
        this.innerHTML += `<mkt-home> </mkt-home>`;
        break;
      case '/marketplace/visit/create':
        this.innerHTML += `<mkt-visit-editor data-user-id="${this.userId}"> </mkt-visit-editor>`;
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
