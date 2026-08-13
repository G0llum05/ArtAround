
class MarketPlaceHome extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <link rel="stylesheet" href="/marketplace/pages/home/home.css">
      <section class="mkt-category-section">
        <h3 class="mkt-section-title">In Evidenza</h3>

        <div class="mkt-cards-row">
          <!-- USIAMO IL NOSTRO WEB COMPONENT CUSTOM! -->
          <mkt-visit-card
            titolo="La Magnificenza del Barocco Romano"
            prezzo="€ 15.00"
            creatore="Palazzo Colonna"
            immagine="/images/GamberettoAllaBolognese.jpeg">
          </mkt-visit-card>

          <mkt-visit-card
            titolo="Il Genio Barocco di Gian Lorenzo Bernini"
            prezzo="€ 15.00"
            creatore="Galleria Borghese"
            immagine="/images/MattiasDream.jpeg">
          </mkt-visit-card>

          <mkt-visit-card
            titolo="Superbike Legend: Ducati 916"
            prezzo="Gratuito"
            creatore="Museo Ducati"
            immagine="/images/IlGr8lloParlante.png">
          </mkt-visit-card>
        </div>
      </section>
    `;
  }
}

customElements.define('mkt-home', MarketPlaceHome);
