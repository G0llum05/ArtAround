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

  setHeroIndex(app, newIndex) {
    const N = Math.min(this.visits.length, 6);
    if (N === 0) return;

    this.heroIndex = (newIndex + N) % N;

    const track = app.container.querySelector('#mkt-hero-track');
    const controls = app.container.querySelector('#mkt-hero-controls');

    if (track) {
      const activePosition = this.heroIndex + 1;
      track.style.transform = `translateX(calc(13% - ${activePosition} * (74% + 1.5rem)))`;

      const slides = track.querySelectorAll('.mkt-hero-card-slide');
      slides.forEach((slide) => {
        const slideIndex = parseInt(slide.dataset.realIndex, 10);
        if (slideIndex === this.heroIndex && slide.dataset.trackPos == activePosition) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    }

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

    // Reset auto-loop timer when index is set
    this.startAutoLoop(app);
  },

  startAutoLoop(app) {
    if (this.autoTimer) clearInterval(this.autoTimer);

    // Auto-advance hero carousel every 5 seconds
    this.autoTimer = setInterval(() => {
      if (this.visits && this.visits.length > 0) {
        const N = Math.min(this.visits.length, 6);
        const nextIdx = (this.heroIndex + 1) % N;
        this.setHeroIndex(app, nextIdx);
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
        const N = Math.min(this.visits.length, 6);
        this.setHeroIndex(app, this.heroIndex - 1);
        return;
      }

      // 2. Next Arrow
      if (e.target.closest('[data-carousel-next]')) {
        const N = Math.min(this.visits.length, 6);
        this.setHeroIndex(app, this.heroIndex + 1);
        return;
      }

      // 3. Dot Indicator or Slide Click
      const slideOrDot = e.target.closest('[data-dot-index]');
      if (slideOrDot && !e.target.closest('[data-like-id]')) {
        const targetIndex = parseInt(slideOrDot.dataset.dotIndex, 10);
        if (!isNaN(targetIndex)) {
          this.setHeroIndex(app, targetIndex);
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
