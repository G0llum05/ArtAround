import {dummyMuseums, dummyVisits} from "./dummydata.js";

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
    switch (this.routes) {
      case '/marketplace':
        this.innerHTML += `<mkt-home> </mkt-home>`;
        break;
      case '/marketplace/visit/create':
        this.innerHTML += `<mkt-visit-editor> </mkt-visit-editor>`;
        break;
      case '/marketplace/visit/search':
        this.innerHTML += `<mkt-visit-explorer> </mkt-visit-explorer>`;
        break;
      default:
        this.innerHTML = ``;
        const payload = {
          destination: `page-not-found`,
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
