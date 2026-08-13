class MarketplaceVisitCard extends HTMLElement {
  connectedCallback() {
    // 1. Leggiamo i dati passati come attributi HTML
    const title = this.getAttribute('titolo') || 'Visita Senza Titolo';
    const price = this.getAttribute('prezzo') || 'Gratuito';
    const image = this.getAttribute('immagine') || '';
    const creator = this.getAttribute('creatore') || 'Sconosciuto';

    // 2. Stampiamo l'HTML usando le variabili
    this.innerHTML = `
      <link rel="stylesheet" href="/marketplace/components/visit-card/visit-card.css">
      <div class="mkt-visit-card">
        <div class="mkt-card-thumb" style="background-image: url('${image}')">
          <div class="mkt-card-thumb-overlay">
            <button class="mkt-card-like-btn" title="Metti Like">🤍</button>
          </div>
        </div>
        <div class="mkt-card-body">
          <h4 class="mkt-card-title">${title}</h4>
          <div class="mkt-card-creator">
            <span>by ${creator}</span>
          </div>
          <div class="mkt-card-footer">
            <span class="mkt-card-price ${price === 'Gratuito' ? 'free' : ''}">
              ${price}
            </span>
          </div>
        </div>
      </div>
    `;

    // 3. Aggiungiamo eventuali eventi (es. il click sul bottone Like)
    const likeBtn = this.querySelector('.mkt-card-like-btn');
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita che il click si propaghi alla card intera
      likeBtn.classList.toggle('liked');
      likeBtn.textContent = likeBtn.classList.contains('liked') ? '❤️' : '🤍';
    });
  }
}

customElements.define('mkt-visit-card', MarketplaceVisitCard);
