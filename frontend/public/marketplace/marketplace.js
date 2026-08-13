// connectedCallback scatta nel momento esatto in cui il tag viene inserito nel DOM
// le variabili CSS del file globale sono disponibili non uso la shadow dom (this.shadowRoot.innerHTML)
// link rel="stylesheet" href="css/editor.css">   <!-- oppure li aggiungo con @import a style.css di angular-->
/*
    //lanciamo un evento verso l'esterno
    const btn = this.querySelector('#btn-test');
    btn.addEventListener('click', () => {

      // CustomEvent è un'API nativa del browser
      const event = new CustomEvent('messaggio-da-vanilla', {
        detail: { testo: 'Ciao Angular, sono il Web Component!' }
      });

      this.dispatchEvent(event); // Spara l'evento fuori dal componente
    });
 */

/*
A differenza del nostro CustomEvent (che di default nasce "pigro" e fermo, per cui dovevamo forzare bubbles: true),
gli eventi nativi del browser come il click nascono già con la proprietà bubbles: true attivata di default.
Questo significa che se clicchi su un qualsiasi elemento, quell'evento click schizzerà sempre verso l'alto, attraversando tutti i div padri.
 */

class Marketplace extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <!-- Carichiamo il CSS globale del marketplace in modo isolato -->
      <link rel="stylesheet" href="/marketplace/marketplace.css">

      <div class="mkt-wrapper">
        <header class="mkt-header">
          <h1 class="mkt-main-title">Marketplace Visite</h1>
          <div class="mkt-header-actions">
            <input type="text" class="mkt-search-input" placeholder="Cerca visite o categorie..." />
          </div>
        </header>

        <div id="mkt-main-content">
           <!-- Inseriamo la home page -->
           <mkt-home></mkt-home>
        </div>
      </div>
    `;
  }
}

// Insegna al browser che il tag <editor-visita-museo> corrisponde a questa classe
// serve inserire sempre almeno un trattino nel nome per i web components
customElements.define('mkt-shell', Marketplace);
