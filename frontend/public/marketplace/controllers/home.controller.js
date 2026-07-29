import { HomeViews } from '../views/home.js';
import { VisitService } from '../services/visit.service.js';

export const HomeController = {
  visits: [],
  heroIndex: 0,
  autoTimer: null,

  async render(app) {
    try {
      this.visits = await VisitService.getAllVisits();
      this.heroIndex = 0;

      this.renderView(app);
      this.startAutoLoop(app);
      this.bindEvents(app);
    } catch (err) {
      console.error('[HomeController] Render error:', err);
      app.container.innerHTML = HomeViews.error(err);
    }
  },

  renderView(app) {
    app.container.innerHTML = HomeViews.home(this.visits, this.heroIndex);
  },

  startAutoLoop(app) {
    if (this.autoTimer) clearInterval(this.autoTimer);

    // Auto-advance hero carousel every 5 seconds
    this.autoTimer = setInterval(() => {
      if (this.visits && this.visits.length > 0) {
        this.heroIndex = (this.heroIndex + 1) % Math.min(this.visits.length, 6);
        this.renderView(app);
      }
    }, 5000);

    // Register timer with app for clean teardown when switching pages
    if (app._timers) {
      app._timers.push(this.autoTimer);
    }
  },

  bindEvents(app) {
    // Delegated click handler on container
    app._addContainerListener('click', (e) => {
      // 1. Previous Arrow
      if (e.target.closest('[data-carousel-prev]')) {
        const heroLen = Math.min(this.visits.length, 6);
        this.heroIndex = (this.heroIndex - 1 + heroLen) % heroLen;
        this.renderView(app);
        return;
      }

      // 2. Next Arrow
      if (e.target.closest('[data-carousel-next]')) {
        const heroLen = Math.min(this.visits.length, 6);
        this.heroIndex = (this.heroIndex + 1) % heroLen;
        this.renderView(app);
        return;
      }

      // 3. Dot Indicator Click
      const dot = e.target.closest('[data-dot-index]');
      if (dot) {
        this.heroIndex = parseInt(dot.dataset.dotIndex, 10);
        this.renderView(app);
        return;
      }

      // 4. Like / Heart Toggle
      const likeBtn = e.target.closest('[data-like-id]');
      if (likeBtn) {
        e.stopPropagation();
        const visitId = likeBtn.dataset.likeId;
        const item = this.visits.find(v => v.id === visitId);
        if (item) {
          item.isLiked = !item.isLiked;
          if (item.isLiked) {
            item.likes = (item.likes || 0) + 1;
          } else {
            item.likes = Math.max(0, (item.likes || 1) - 1);
          }
          this.renderView(app);
        }
        return;
      }
    });
  }
};
