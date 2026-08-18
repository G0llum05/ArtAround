//components
import {MktHomeInputFields} from "./components/home-input-fields/home-input-fields.js";
customElements.define('mkt-home-input-fields', MktHomeInputFields);

import {MktMuseumCard} from "./components/museum-card/musuem-card.js";
customElements.define('mkt-museum-card', MktMuseumCard);

import {MktVisitCard} from "./components/visit-card/visit-card.js";
customElements.define('mkt-visit-card', MktVisitCard);

import {MktInputSearchText} from "./components/input-field-search-museum/input-field-search-museum.js";
customElements.define('mkt-input-search-visit', MktInputSearchText);

import {MktCardGrid} from "./components/skeleton-card-grid/skeleton-card-grid.js";
customElements.define('mkt-skeleton-card-grid', MktCardGrid);

import {MktArtworkLibrary} from "./components/artwork-library/artwork-library.js";
customElements.define('mkt-artwork-library', MktArtworkLibrary);

//pages
import {MktVisitExplorer} from "./pages/visit-explorer/visit-explorer.js";
customElements.define('mkt-visit-explorer', MktVisitExplorer);

import {MktVisitEditor} from "./pages/visit-editor/visit-editor.js";
customElements.define('mkt-visit-editor', MktVisitEditor);

import {MktMuseumHome} from "./pages/museum-home/museum-home.js";
customElements.define('mkt-museum-home', MktMuseumHome);

import {MktHome} from "./pages/home/home.js";
customElements.define('mkt-home', MktHome);

import {MktRouter} from "./router.js";
customElements.define('mkt-router', MktRouter);

