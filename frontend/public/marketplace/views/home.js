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
    const N = heroList.length;
    const safeHeroIndex = heroIndex % N;

    // Infinite track: [Last item, Item 0, Item 1, ..., Item N-1, First item]
    const trackItems = [
      heroList[N - 1],
      ...heroList,
      heroList[0]
    ];
    const activeTrackPosition = safeHeroIndex + 1;

    // --- 1. THEMATIC VISIT CATEGORIES (Restored to original top position!) ---
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

    // --- 2. POPULARITY / ENGAGEMENT SECTIONS ---
    // "Più Popolari": sorted EXCLUSIVELY by likesCount / likes
    const mostLiked = [...visits]
      .filter(v => (v.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 8);

    // "Più Viste della Settimana": sorted EXCLUSIVELY by weekly views
    const mostViewedWeekly = [...visits]
      .filter(v => v.views && (v.views.weekly || 0) > 0)
      .sort((a, b) => (b.views?.weekly || 0) - (a.views?.weekly || 0))
      .slice(0, 8);

    // "Più Viste di Sempre": sorted EXCLUSIVELY by total views
    const mostViewedTotal = [...visits]
      .filter(v => v.views && (v.views.total || 0) > 0)
      .sort((a, b) => (b.views?.total || 0) - (a.views?.total || 0))
      .slice(0, 8);

    const freeVisits = visits.filter(v => v.price === 0);

    const engagementSections = [];
    if (mostLiked.length > 0) {
      engagementSections.push({ title: 'Più Popolari', items: mostLiked });
    }
    if (mostViewedWeekly.length > 0) {
      engagementSections.push({ title: 'Più Viste della Settimana', items: mostViewedWeekly });
    }
    if (mostViewedTotal.length > 0) {
      engagementSections.push({ title: 'Più Viste di Sempre', items: mostViewedTotal });
    }
    if (freeVisits.length > 0) {
      engagementSections.push({ title: 'Visite Gratuite', items: freeVisits });
    }

    const allSections = [...thematicSections, ...engagementSections];

    const renderCard = (v) => `
      <div class="mkt-visit-card" data-visit-id="${v.id}">
        <div class="mkt-card-thumb" style="background-image: url('${v.image}')">
          <div class="mkt-card-thumb-overlay">
            <span class="mkt-card-views-badge" title="${v.views?.weekly || 0} viste questa settimana / ${v.views?.total || 0} totali">
              ${v.views?.weekly ?? v.views?.total ?? 0} viste
            </span>
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
            <input type="text" class="mkt-search-input" placeholder="Cerca visite o categorie..." />
          </div>
        </header>

        <!-- HERO SLIDER CAROUSEL (Rullino infinito a traslazione continua) -->
        <section class="mkt-hero-section">
          <button class="mkt-carousel-arrow mkt-arrow-prev" data-carousel-prev>‹</button>
          <button class="mkt-carousel-arrow mkt-arrow-next" data-carousel-next>›</button>

          <div class="mkt-hero-viewport">
            <div class="mkt-hero-track" id="mkt-hero-track" style="transform: translateX(calc(13% - ${activeTrackPosition} * (74% + 1.5rem)));">
              ${trackItems.map((item, trackIdx) => {
                const realIndex = (trackIdx - 1 + N) % N;
                const isActive = trackIdx === activeTrackPosition;
                return `
                  <div class="mkt-hero-card-slide ${isActive ? 'active' : ''}" data-dot-index="${realIndex}" data-real-index="${realIndex}" data-track-pos="${trackIdx}">
                    <div class="mkt-hero-card-bg" style="background-image: url('${item.image}')">
                      <div class="mkt-hero-overlay">
                        <div class="mkt-hero-top">
                          <button class="mkt-like-btn ${item.isLiked ? 'liked' : ''}" data-like-id="${item.id}">
                            <span class="mkt-heart-icon">♥</span> <span>${item.likes || 0} Likes</span>
                          </button>
                        </div>
                        <div class="mkt-hero-bottom">
                          <div class="mkt-hero-info">
                            <h2 class="mkt-hero-title">${item.title}</h2>
                            <div class="mkt-creator-badge">
                              <span>Creatore: <strong>${item.creator}</strong></span>
                              ${item.creatorVerified ? '<span class="mkt-verified-check">✓</span>' : ''}
                              <span style="margin-left:0.5rem">• ${item.duration}</span>
                            </div>
                            <p class="mkt-hero-desc">${item.description}</p>
                          </div>
                          <div class="mkt-badge-group">
                            <span class="mkt-views-badge" title="Visualizzazioni della visita">
                              ${item.views?.weekly || 0} viste sett. (${item.views?.total || 0} tot.)
                            </span>
                            <span class="mkt-price-badge ${item.price === 0 ? 'mkt-price-free' : ''}">
                              ${item.price === 0 ? 'Gratuito' : `€ ${item.price.toFixed(2)}`}
                            </span>
                            <span class="mkt-license-badge">${item.license || 'Standard'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Bottom Indicators (Dots) -->
          <div class="mkt-hero-controls" id="mkt-hero-controls">
            ${heroList.map((_, idx) => `
              <div class="mkt-dot ${idx === safeHeroIndex ? 'active' : ''}" data-dot-index="${idx}"></div>
            `).join('')}
          </div>
        </section>

        <!-- SECTIONS (Thematic Categories + Popularity/Views/Free) -->
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
