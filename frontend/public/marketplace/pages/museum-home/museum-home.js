export class MktMuseumHome extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <link rel="stylesheet" href="/marketplace/pages/museum-home/museum-home.css"/>

      <div class="mkt-museum-page">
        <!-- 1. HERO SECTION -->
        <header class="mkt-museum-hero" style="background-image: url('https://picsum.photos/seed/museum-hero/1200/500')">
          <div class="mkt-hero-overlay">
            <div class="mkt-hero-content">
              <h1 class="mkt-museum-title">The National Gallery</h1>
              <p class="mkt-museum-subtitle">A premier institution dedicated to the preservation and exhibition of classical European art, spanning from the 13th to the early 20th century.</p>
            </div>
          </div>
        </header>

        <main class="mkt-museum-container">
          <!-- GRIGLIA PRINCIPALE A DUE COLONNE -->
          <div class="mkt-museum-grid">

            <!-- COLONNA SINISTRA -->
            <div class="mkt-col-left">

              <!-- About the Museum -->
              <section class="mkt-card">
                <h2 class="mkt-card-heading">About the Museum</h2>
                <p class="mkt-card-text">
                  The National Gallery houses one of the greatest collections of paintings in the world. Founded in 1824, the collection now comprises over 2,300 works. Our mission is to care for and preserve the collection for future generations, while making it accessible to the widest possible audience through free admission, research, and education programs.
                </p>
                <div class="mkt-info-split">
                  <div class="mkt-info-block">
                    <span class="mkt-info-label">Location</span>
                    <p class="mkt-info-val">Trafalgar Square<br>London, WC2N 5DN<br>United Kingdom</p>
                  </div>
                  <div class="mkt-info-block">
                    <span class="mkt-info-label">Contact</span>
                    <p class="mkt-info-val">📞 +44 20 7747 2885<br>✉️ info@nationalgallery.org.uk<br>🌐 nationalgallery.org.uk</p>
                  </div>
                </div>
              </section>

              <!-- Services & Accessibility (Due box affiancati) -->
              <div class="mkt-duo-grid">
                <section class="mkt-card">
                  <h3 class="mkt-section-subheading">Services</h3>
                  <ul class="mkt-icon-list">
                    <li>🚻 Toilets</li>
                    <li>☕ Cafe</li>
                    <li>🛍️ Shop</li>
                    <li>🎧 Audio Guide</li>
                    <li>🛗 Elevator</li>
                    <li>🍽️ Restaurant</li>
                    <li>📶 Free Wi-Fi</li>
                  </ul>
                </section>

                <section class="mkt-card">
                  <h3 class="mkt-section-subheading">Accessibility</h3>
                  <ul class="mkt-icon-list">
                    <li>♿ Fully wheelchair accessible</li>
                    <li>🦯 Tactile paths throughout main galleries</li>
                    <li>📖 Braille descriptions available</li>
                  </ul>
                </section>
              </div>

              <!-- Current Exhibitions -->
              <section class="mkt-card">
                <h2 class="mkt-card-heading">Current Exhibitions</h2>
                <div class="mkt-exhibition-item">
                  <img src="https://picsum.photos/seed/turner/200/120" alt="Turner's Seascapes" class="mkt-exhibition-img">
                  <div class="mkt-exhibition-details">
                    <h4>Turner's Seascapes</h4>
                    <span class="mkt-date">Oct 12, 2025 - Feb 25, 2026</span>
                    <p>Explore the dramatic and evocative marine paintings of J.M.W. Turner, capturing the power and unpredictability of the ocean.</p>
                  </div>
                </div>
              </section>

            </div>

            <!-- COLONNA DESTRA -->
            <div class="mkt-col-right">

              <!-- Plan Your Visit -->
              <section class="mkt-card mkt-plan-card">
                <h2 class="mkt-card-heading text-center">Plan Your Visit</h2>
                <div class="mkt-price-row"><span>General Admission</span> <strong>Free</strong></div>
                <div class="mkt-price-row"><span>Special Exhibitions</span> <strong>£20</strong></div>
                <div class="mkt-price-row"><span>Students / Seniors</span> <strong>£15</strong></div>
                <div class="mkt-price-row"><span>Members</span> <strong>Free</strong></div>
                <button class="mkt-btn-primary mt-md">BOOK TICKETS</button>
              </section>

              <!-- Hours -->
              <section class="mkt-card">
                <h2 class="mkt-card-heading">Hours</h2>
                <div class="mkt-hour-row"><span>Monday</span> <span>10:00 - 18:00</span></div>
                <div class="mkt-hour-row"><span>Tuesday</span> <span>10:00 - 18:00</span></div>
                <div class="mkt-hour-row"><span>Wednesday</span> <span>10:00 - 18:00</span></div>
                <div class="mkt-hour-row"><span>Thursday</span> <span>10:00 - 18:00</span></div>
                <div class="mkt-hour-row highlight"><span>Friday</span> <span>10:00 - 21:00</span></div>
                <div class="mkt-hour-row"><span>Saturday</span> <span>10:00 - 18:00</span></div>
                <div class="mkt-hour-row"><span>Sunday</span> <span>10:00 - 18:00</span></div>
                <small class="mkt-note">Closed on Dec 24, 25, and Jan 1.</small>
              </section>

              <!-- How to Get Here -->
              <section class="mkt-card">
                <h2 class="mkt-card-heading">How to Get Here</h2>
                <p class="mkt-transport-title">PUBLIC TRANSPORT</p>
                <p class="mkt-transport-desc">Subway: Charing Cross (Northern & Bakerloo lines), Embankment (District & Circle lines).<br>Bus: Routes 2, 6, 9, 11, 12, 13, 15, 23, 24, 29, 53, 87, 88, 91, 139, 159, 176, 453.</p>
                <p class="mkt-transport-title mt-md">PARKING</p>
                <p class="mkt-transport-desc">Public parking is available at the Leicester Square and Trafalgar car parks. Blue Badge holders can park in designated bays on St Martin's Street.</p>
              </section>

            </div>

          </div>

          <!-- 3. SEZIONE IN BASSO: TUTTE LE VISITE -->
          <section class="mkt-bottom-section">
            <div class="mkt-section-header">
              <h2>Tutte le Visite</h2>
              <a href="#" class="mkt-see-all">See all →</a>
            </div>
            <div class="mkt-horizontal-track">
              <!-- Riutilizza il tuo componente visit-card -->
              <mkt-visit-card data-title="Highlights Tour" data-desc="Discover the masterpieces of the collection in this guided tour." data-duration="60 min" data-price="15" data-image="https://picsum.photos/seed/v1/400/300"></mkt-visit-card>
              <mkt-visit-card data-title="Renaissance Masters" data-desc="An in-depth look at Italian and Northern Renaissance art." data-duration="90 min" data-price="20" data-image="https://picsum.photos/seed/v2/400/300"></mkt-visit-card>
              <mkt-visit-card data-title="Impressionism" data-desc="Explore the light and color of 19th-century French painting." data-duration="60 min" data-price="15" data-image="https://picsum.photos/seed/v3/400/300"></mkt-visit-card>
              <mkt-visit-card data-title="Family Tour" data-desc="Interactive exploration designed for children and parents." data-duration="45 min" data-price="0" data-image="https://picsum.photos/seed/v4/400/300"></mkt-visit-card>
            </div>
          </section>

          <!-- 4. SEZIONE IN BASSO: TUTTI GLI ARTWORKS -->
          <section class="mkt-bottom-section">
            <div class="mkt-section-header">
              <h2>Tutti gli Artworks</h2>
              <a href="#" class="mkt-see-all">See all →</a>
            </div>
            <div class="mkt-horizontal-track">
              <div class="mkt-artwork-card">
                <img src="https://picsum.photos/seed/art1/300/300" alt="Art">
                <h4>The Fighting Temeraire</h4>
                <p>J.M.W. Turner, 1839</p>
              </div>
              <div class="mkt-artwork-card">
                <img src="https://picsum.photos/seed/art2/300/300" alt="Art">
                <h4>Sunflowers</h4>
                <p>Vincent van Gogh, 1888</p>
              </div>
              <div class="mkt-artwork-card">
                <img src="https://picsum.photos/seed/art3/300/300" alt="Art">
                <h4>Bathers at Asnières</h4>
                <p>Georges Seurat, 1884</p>
              </div>
              <div class="mkt-artwork-card">
                <img src="https://picsum.photos/seed/art4/300/300" alt="Art">
                <h4>The Arnolfini Portrait</h4>
                <p>Jan van Eyck, 1434</p>
              </div>
            </div>
          </section>

        </main>
      </div>
    `;
  }
}
