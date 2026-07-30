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

    // --- 1. POPULARITY / ENGAGEMENT SECTIONS (Likes & Views) ---
    const mostLiked = [...visits]
      .filter(v => (v.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 8);

    const mostViewedWeekly = [...visits]
      .filter(v => v.views && (v.views.weekly || 0) > 0)
      .sort((a, b) => (b.views?.weekly || 0) - (a.views?.weekly || 0))
      .slice(0, 8);

    const mostViewedTotal = [...visits]
      .filter(v => v.views && (v.views.total || 0) > 0)
      .sort((a, b) => (b.views?.total || 0) - (a.views?.total || 0))
      .slice(0, 8);

    const freeVisits = visits.filter(v => v.price === 0);

    const engagementSections = [];
    if (mostLiked.length > 0) {
      engagementSections.push({ title: '🔥 Più Popolari (Like)', items: mostLiked });
    }
    if (mostViewedWeekly.length > 0) {
      engagementSections.push({ title: '👁️ Più Viste della Settimana', items: mostViewedWeekly });
    }
    if (mostViewedTotal.length > 0) {
      engagementSections.push({ title: '📈 Più Viste di Sempre', items: mostViewedTotal });
    }
    if (freeVisits.length > 0) {
      engagementSections.push({ title: '🎟️ Visite Gratuite', items: freeVisits });
    }

    // --- 2. THEMATIC VISIT CATEGORIES ---
    const THEMATIC_CATEGORIES = [
      'Motori', 'Scienza', 'Archeologia', 'Didattica', 'Musica', 
      'Rinascimento', 'Arte Moderna', 'Antica Grecia', 'Antica Roma', 
      'Oriente', 'Antico Egitto', 'Medioevo', 'Neoclassicismo', 
      'Impressionismo', 'Realismo', 'Puntinismo', 'Avanguardie'
    ];

    const categoryMap = {};
    for (const v of visits) {
      const cats = (v.categories && v.categories.length > 0) 
        ? v.categories 
        : [v.theme || "Generale"];

      for (const cat of cats) {
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(v);
      }
    }

    const thematicSections = THEMATIC_CATEGORIES
      .filter(catName => categoryMap[catName] && categoryMap[catName].length > 0)
      .map(catName => ({
        title: `Categoria: ${catName}`,
        items: categoryMap[catName]
      }));

    // Fallback for any non-standard theme
    Object.keys(categoryMap).forEach(catName => {
      if (!THEMATIC_CATEGORIES.includes(catName) && categoryMap[catName].length > 0) {
        thematicSections.push({ title: `Categoria: ${catName}`, items: categoryMap[catName] });
      }
    });

    const allSections = [...engagementSections, ...thematicSections];

    const renderCard = (v) => `
      <div class="mkt-visit-card" data-visit-id="${v.id}">
        <div class="mkt-card-thumb" style="background-image: url('${v.image}')">
          <div class="mkt-card-thumb-overlay">
            <span class="mkt-card-views-badge" title="${v.views?.weekly || 0} visite questa settimana / ${v.views?.total || 0} totali">
              👁️ ${v.views?.weekly ?? v.views?.total ?? 0}
            </span>
            <button class="mkt-card-like-btn ${v.isLiked ? 'liked' : ''}" data-like-id="${v.id}" title="Metti Like">
              ♥ <span class="mkt-like-count">${v.likes || 0}</span>
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
            <input type="text" class="mkt-search-input" placeholder="Cerca visite o categorie..." />
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
                  <span class="mkt-heart-icon">♥</span> <span>${heroVisit.likes || 0} Likes</span>
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
                  <span class="mkt-views-badge" title="Visualizzazioni della visita">
                    👁️ ${heroVisit.views?.weekly || 0} viste sett. (${heroVisit.views?.total || 0} tot.)
                  </span>
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

        <!-- SECTIONS (Engagement: Popular/Views/Free + Thematic Categories) -->
        ${allSections.map(sec => `
          <section class="mkt-category-section">
            <h3 class="mkt-section-title">${sec.title}</h3>
            <div class="mkt-cards-row">
              ${sec.items.map(renderCard).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    `;
  },

  error(err) {
    return `<div class="mkt-wrapper"><div class="mkt-error">Errore caricamento marketplace: ${err.message}</div></div>`;
  }
};
