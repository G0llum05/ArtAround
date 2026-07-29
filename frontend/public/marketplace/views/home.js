export const HomeViews = {
  home(visits = [], heroIndex = 0) {
    if (!visits || visits.length === 0) {
      return `
        <div class="mkt-wrapper">
          <div class="mkt-header">
            <h1 class="mkt-main-title">Marketplace Visite</h1>
          </div>
          <p style="text-align:center; padding: 3rem; color: #8b949e;">Caricamento visite in corso...</p>
        </div>
      `;
    }

    const heroList = visits.slice(0, 6);
    const safeHeroIndex = heroIndex % heroList.length;
    const heroVisit = heroList[safeHeroIndex];

    const colonnaVisits = visits.filter(v => v.theme === "Palazzo Colonna" || (v.title && (v.title.toLowerCase().includes("colonna") || v.title.toLowerCase().includes("carracci") || v.title.toLowerCase().includes("mangiafagioli"))));
    const vaticaniVisits = visits.filter(v => v.theme === "Musei Vaticani" || (v.title && (v.title.toLowerCase().includes("sistina") || v.title.toLowerCase().includes("vatican") || v.title.toLowerCase().includes("laocoonte") || v.title.toLowerCase().includes("stanze di raffaello"))));
    const borgheseVisits = visits.filter(v => v.theme === "Galleria Borghese" || (v.title && (v.title.toLowerCase().includes("borghese") || v.title.toLowerCase().includes("bernini") || v.title.toLowerCase().includes("caravaggio") || v.title.toLowerCase().includes("paolina"))));
    const museumVisits = visits.filter(v => v.theme === "Museo del Patrimonio Industriale" || (v.title && (v.title.toLowerCase().includes("patrimonio") || v.title.toLowerCase().includes("seta") || v.title.toLowerCase().includes("navile"))));
    const ducatiVisits = visits.filter(v => v.theme === "Museo Ducati" || (v.title && (v.title.toLowerCase().includes("ducati") || v.title.toLowerCase().includes("desmo") || v.title.toLowerCase().includes("cucciolo") || v.title.toLowerCase().includes("superbike"))));
    const archeoVisits = visits.filter(v => v.theme === "Museo Civico Archeologico" || (v.title && (v.title.toLowerCase().includes("archeo") || v.title.toLowerCase().includes("etrusca") || v.title.toLowerCase().includes("egitto") || v.title.toLowerCase().includes("fidia"))));
    const poggiVisits = visits.filter(v => v.theme === "Palazzo Poggi" || (v.title && (v.title.toLowerCase().includes("poggi") || v.title.toLowerCase().includes("anatomia") || v.title.toLowerCase().includes("marsili"))));
    const carducciVisits = visits.filter(v => v.theme === "Casa Carducci" || (v.title && v.title.toLowerCase().includes("carducci")));
    const theme800Visits = visits.filter(v => v.theme === "800" || (v.title && (v.title.toLowerCase().includes("protoindustria") || v.title.toLowerCase().includes("radio"))));
    const neoclassicoVisits = visits.filter(v => v.theme === "Neoclassicismo" || (v.title && (v.title.toLowerCase().includes("neoclassicismo") || v.title.toLowerCase().includes("marmo"))));

    const renderCard = (v) => `
      <div class="mkt-visit-card" data-visit-id="${v.id}">
        <div class="mkt-card-thumb" style="background-image: url('${v.image}')">
          <div class="mkt-card-thumb-overlay">
            <button class="mkt-card-like-btn ${v.isLiked ? 'liked' : ''}" data-like-id="${v.id}" title="Metti Like">
              ♥
            </button>
          </div>
        </div>
        <div class="mkt-card-body">
          <h4 class="mkt-card-title">${v.title}</h4>
          <div class="mkt-card-creator">
            <span>by ${v.creator}</span>
            ${v.creatorVerified ? '<span class="mkt-verified-check">✓</span>' : ''}
          </div>
          <div class="mkt-card-footer">
            <span class="mkt-card-price ${v.price === 0 ? 'free' : ''}">
              ${v.price === 0 ? 'Gratuito' : `€ ${v.price.toFixed(2)}`}
            </span>
            <span class="mkt-card-license">${v.license || 'Standard'}</span>
          </div>
        </div>
      </div>
    `;

    return `
      <div class="mkt-wrapper">
        <header class="mkt-header">
          <h1 class="mkt-main-title">Marketplace Visite</h1>
          <div class="mkt-header-actions">
            <input type="text" class="mkt-search-input" placeholder="Cerca visite o temi..." />
          </div>
        </header>

        <!-- HERO FEATURED CAROUSEL ("Scelta Visite" Loop) -->
        <section class="mkt-hero-section">
          <button class="mkt-carousel-arrow mkt-arrow-prev" data-carousel-prev>‹</button>
          <button class="mkt-carousel-arrow mkt-arrow-next" data-carousel-next>›</button>

          <div class="mkt-hero-card" style="background-image: url('${heroVisit.image}')">
            <div class="mkt-hero-overlay">
              <div class="mkt-hero-top">
                <button class="mkt-like-btn ${heroVisit.isLiked ? 'liked' : ''}" data-like-id="${heroVisit.id}">
                  <span class="mkt-heart-icon">♥</span>
                </button>
              </div>
              <div class="mkt-hero-bottom">
                <div class="mkt-hero-info">
                  <h2 class="mkt-hero-title">${heroVisit.title}</h2>
                  <div class="mkt-creator-badge">
                    <span>Creatore: <strong>${heroVisit.creator}</strong></span>
                    ${heroVisit.creatorVerified ? '<span class="mkt-verified-check">✓</span>' : ''}
                    <span style="margin-left:0.5rem">• ${heroVisit.duration}</span>
                  </div>
                  <p class="mkt-hero-desc">${heroVisit.description}</p>
                </div>
                <div class="mkt-badge-group">
                  <span class="mkt-price-badge ${heroVisit.price === 0 ? 'mkt-price-free' : ''}">
                    ${heroVisit.price === 0 ? 'Gratuito' : `€ ${heroVisit.price.toFixed(2)}`}
                  </span>
                  <span class="mkt-license-badge">${heroVisit.license}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Indicators (Dots) -->
          <div class="mkt-hero-controls">
            ${heroList.map((_, idx) => `
              <div class="mkt-dot ${idx === safeHeroIndex ? 'active' : ''}" data-dot-index="${idx}"></div>
            `).join('')}
          </div>
        </section>

        <!-- CATEGORY ROWS -->
        <!-- Row -0.5: Palazzo Colonna -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite di Palazzo Colonna e Galleria Colonna di Roma</h3>
          <div class="mkt-cards-row">
            ${(colonnaVisits.length > 0 ? colonnaVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 0: Musei Vaticani -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite dei Musei Vaticani e Cappella Sistina</h3>
          <div class="mkt-cards-row">
            ${(vaticaniVisits.length > 0 ? vaticaniVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 0.2: Galleria Borghese -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite della Galleria Borghese di Roma</h3>
          <div class="mkt-cards-row">
            ${(borgheseVisits.length > 0 ? borgheseVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 0.5: Museo Ducati -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite del Museo Ducati</h3>
          <div class="mkt-cards-row">
            ${(ducatiVisits.length > 0 ? ducatiVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 1: Museo del Patrimonio Industriale -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite del Museo del Patrimonio Industriale</h3>
          <div class="mkt-cards-row">
            ${(museumVisits.length > 0 ? museumVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 1.5: Museo Civico Archeologico -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite del Museo Civico Archeologico</h3>
          <div class="mkt-cards-row">
            ${(archeoVisits.length > 0 ? archeoVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 2: Museo di Palazzo Poggi -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite di Palazzo Poggi</h3>
          <div class="mkt-cards-row">
            ${(poggiVisits.length > 0 ? poggiVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 3: Museo di Casa Carducci -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Visite di Casa Carducci</h3>
          <div class="mkt-cards-row">
            ${(carducciVisits.length > 0 ? carducciVisits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 2: Tema 800 / Meccanica e Motori -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">800 - Protoindustria e Meccanica</h3>
          <div class="mkt-cards-row">
            ${(theme800Visits.length > 0 ? theme800Visits : visits).map(renderCard).join('')}
          </div>
        </section>

        <!-- Row 3: Tema Neoclassicismo -->
        <section class="mkt-category-section">
          <h3 class="mkt-section-title">Neoclassicismo e Scultura</h3>
          <div class="mkt-cards-row">
            ${(neoclassicoVisits.length > 0 ? neoclassicoVisits : visits).map(renderCard).join('')}
          </div>
        </section>
      </div>
    `;
  },

  error(err) {
    return `<div class="mkt-wrapper"><div class="mkt-error">Errore caricamento marketplace: ${err.message}</div></div>`;
  }
};
