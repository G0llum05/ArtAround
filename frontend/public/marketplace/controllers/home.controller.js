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

  setHeroIndex(app, targetIndex, deltaDirection = null) {
    const N = Math.min(this.visits.length, 6);
    if (N === 0) return;

    const track = app.container.querySelector('#mkt-hero-track');
    const controls = app.container.querySelector('#mkt-hero-controls');

    if (!track) return;

    const currentTrackPos = this.heroIndex + 2;
    let targetTrackPos;
    let newHeroIndex;

    if (deltaDirection === 1) {
      // Forward step (+1)
      targetTrackPos = currentTrackPos + 1;
      newHeroIndex = (this.heroIndex + 1) % N;
    } else if (deltaDirection === -1) {
      // Backward step (-1)
      targetTrackPos = currentTrackPos - 1;
      newHeroIndex = (this.heroIndex - 1 + N) % N;
    } else {
      // Direct jump to a specific dot index
      newHeroIndex = (targetIndex + N) % N;
      targetTrackPos = newHeroIndex + 2;
    }

    this.heroIndex = newHeroIndex;

    // 1. Enable CSS transition and animate transform
    track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(calc(13% - ${targetTrackPos} * (74% + 1.5rem)))`;

    // 2. Set active visual class on ALL slides matching real index
    const slides = track.querySelectorAll('.mkt-hero-card-slide');
    slides.forEach((slide) => {
      const realIdx = parseInt(slide.dataset.realIndex, 10);
      if (realIdx === this.heroIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // 3. Update active dot indicator
    if (controls) {
      const dots = controls.querySelectorAll('.mkt-dot');
      dots.forEach((dot) => {
        const dotIdx = parseInt(dot.dataset.dotIndex, 10);
        if (dotIdx === this.heroIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    // 4. Instant silent reset when overshooting to clone endpoints (after 600ms animation)
    if (targetTrackPos === N + 2) {
      // Reached forward clone (V0 clone at pos N+2) -> reset silently to real V0 at pos 2
      setTimeout(() => {
        track.style.transition = 'none';
        const realPos = 2;
        track.style.transform = `translateX(calc(13% - ${realPos} * (74% + 1.5rem)))`;
        void track.offsetHeight; // Force reflow
      }, 600);
    } else if (targetTrackPos === 1) {
      // Reached backward clone (V_last clone at pos 1) -> reset silently to real V_last at pos N+1
      setTimeout(() => {
        track.style.transition = 'none';
        const realPos = N + 1;
        track.style.transform = `translateX(calc(13% - ${realPos} * (74% + 1.5rem)))`;
        void track.offsetHeight; // Force reflow
      }, 600);
    }

    // Reset auto-loop timer on interaction
    this.startAutoLoop(app);
  },

  startAutoLoop(app) {
    if (this.autoTimer) clearInterval(this.autoTimer);

    // Auto-advance hero carousel forward every 5 seconds
    this.autoTimer = setInterval(() => {
      if (this.visits && this.visits.length > 0) {
        this.setHeroIndex(app, null, 1);
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
      // 1. Previous Arrow -> Move backward (-1)
      if (e.target.closest('[data-carousel-prev]')) {
        this.setHeroIndex(app, null, -1);
        return;
      }

      // 2. Next Arrow -> Move forward (+1)
      if (e.target.closest('[data-carousel-next]')) {
        this.setHeroIndex(app, null, 1);
        return;
      }

      // 3. Dot Indicator or Slide Click -> Jump to target index
      const slideOrDot = e.target.closest('[data-dot-index]');
      if (slideOrDot && !e.target.closest('[data-like-id]')) {
        const targetIndex = parseInt(slideOrDot.dataset.dotIndex, 10);
        if (!isNaN(targetIndex)) {
          this.setHeroIndex(app, targetIndex, null);
        }
        return;
      }

      // 4. Like / Heart Toggle (Targeted DOM update without innerHTML wipe)
      const likeBtn = e.target.closest('[data-like-id]');
      if (likeBtn) {
        e.stopPropagation();
        e.preventDefault();
        const visitId = likeBtn.dataset.likeId;
        const item = this.visits.find(v => v.id === visitId);
        if (item) {
          item.isLiked = !item.isLiked;
          const delta = item.isLiked ? 1 : -1;
          if (item.isLiked) {
            item.likes = (item.likes || 0) + 1;
          } else {
            item.likes = Math.max(0, (item.likes || 1) - 1);
          }

          // Dynamically update all matching like buttons in the DOM
          const matchingBtns = app.container.querySelectorAll(`[data-like-id="${visitId}"]`);
          matchingBtns.forEach(btn => {
            if (item.isLiked) {
              btn.classList.add('liked');
            } else {
              btn.classList.remove('liked');
            }
            const countSpan = btn.querySelector('.mkt-like-count');
            if (countSpan) {
              countSpan.textContent = item.likes;
            }
          });

          VisitService.toggleLike(visitId, delta);
        }
        return;
      }
    });
  }
};
