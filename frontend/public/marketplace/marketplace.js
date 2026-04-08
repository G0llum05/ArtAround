// "use strict";
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// /**
//  * REATTIVITÀ: Semplice Signal per gestire lo stato senza ricaricare la pagina
//  */
// class Signal {
//     constructor(v) {
//         this.listeners = [];
//         this._val = v;
//     }
//     get value() { return this._val; }
//     set value(v) { this._val = v; this.listeners.forEach(l => l(v)); }
//     subscribe(l) { this.listeners.push(l); l(this._val); }
// }
// const API_URL = 'http://localhost:8000/api/opera';
// // STATI REATTIVI
// const operas = new Signal([]);
// const makers = new Signal([]);
// const currents = new Signal([]);
// const techniques = new Signal([]);
// const materials = new Signal([]);
// document.addEventListener('DOMContentLoaded', () => {
//     var _a;
//     const grid = document.getElementById('grid');
//     const counter = document.getElementById('counter');
//     const form = document.getElementById('opera-form');
//     // --- 1. SINCRONIZZAZIONE UI ---
//     // Griglia opere
//     operas.subscribe(list => {
//         if (!grid || !counter)
//             return;
//         counter.innerText = `${list.length} Opere`;
//         grid.innerHTML = '';
//         list.forEach(op => grid.appendChild(createCard(op)));
//     });
//     // Chips per array dinamici
//     const syncChips = (signal, containerId) => {
//         signal.subscribe(items => {
//             const container = document.getElementById(containerId);
//             if (!container)
//                 return;
//             container.innerHTML = items.map((it, i) => `
//                 <div class="chip">${it} <i class="bi bi-x-circle-fill" onclick="removeChip('${containerId}', ${i})"></i></div>
//             `).join('');
//         });
//     };
//     syncChips(makers, 'makers-chips');
//     syncChips(currents, 'currents-chips');
//     syncChips(techniques, 'techs-chips');
//     syncChips(materials, 'mats-chips');
//     // Funzione globale per rimuovere chip (chiamata dall'onclick inline per semplicità)
//     window.removeChip = (type, index) => {
//         if (type === 'makers-chips')
//             makers.value = makers.value.filter((_, i) => i !== index);
//         if (type === 'currents-chips')
//             currents.value = currents.value.filter((_, i) => i !== index);
//         if (type === 'techs-chips')
//             techniques.value = techniques.value.filter((_, i) => i !== index);
//         if (type === 'mats-chips')
//             materials.value = materials.value.filter((_, i) => i !== index);
//     };
//     // --- 2. GESTIONE INPUT ---
//     const setupAddBtn = (btnId, inputId, signal) => {
//         var _a;
//         (_a = document.getElementById(btnId)) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
//             const input = document.getElementById(inputId);
//             if (input.value) {
//                 signal.value = [...signal.value, input.value];
//                 input.value = '';
//             }
//         });
//     };
//     setupAddBtn('add-maker-btn', 'maker-id', makers);
//     setupAddBtn('add-current-btn', 'current', currents);
//     setupAddBtn('add-tech-btn', 'technique', techniques);
//     setupAddBtn('add-mat-btn', 'material', materials);
//     // --- 3. OPERAZIONI API ---
//     function load() {
//         return __awaiter(this, void 0, void 0, function* () {
//             try {
//                 const res = yield fetch(API_URL);
//                 operas.value = yield res.json();
//             }
//             catch (e) {
//                 console.error(e);
//             }
//         });
//     }
//     form.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
//         e.preventDefault();
//         const payload = {
//             title: document.getElementById('title').value,
//             description: document.getElementById('description').value,
//             startYear: Number(document.getElementById('startYear').value) || undefined,
//             endYear: Number(document.getElementById('endYear').value) || undefined,
//             makers: makers.value,
//             museum: document.getElementById('museum').value || undefined,
//             location: {
//                 room: document.getElementById('room').value,
//                 floor: document.getElementById('floor').value,
//                 building: document.getElementById('building').value
//             },
//             dimensions: {
//                 height: Number(document.getElementById('h').value) || undefined,
//                 width: Number(document.getElementById('w').value) || undefined,
//                 depth: Number(document.getElementById('d').value) || undefined,
//                 unit: document.getElementById('unit').value
//             },
//             artisticCurrents: currents.value,
//             details: {
//                 objectType: document.getElementById('objType').value,
//                 techniques: techniques.value,
//                 materials: materials.value
//             },
//             copyOf: document.getElementById('copyOf').value || undefined,
//             falsificationOf: document.getElementById('falsificationOf').value || undefined
//         };
//         const res = yield fetch(API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
//         if (res.ok) {
//             form.reset();
//             [makers, currents, techniques, materials].forEach(s => s.value = []);
//             load();
//         }
//     }));
//     function remove(id) {
//         return __awaiter(this, void 0, void 0, function* () {
//             if (confirm("Eliminare l'opera?")) {
//                 yield fetch(`${API_URL}/${id}`, { method: 'DELETE' });
//                 load();
//             }
//         });
//     }
//     // --- 4. RENDER CARD ---
//     function createCard(op) {
//         var _a, _b, _c, _d;
//         const col = document.createElement('div');
//         col.className = 'col-sm-6 col-xl-4';
//         const makerText = ((_a = op.makers) === null || _a === void 0 ? void 0 : _a.length) ? `<div class="small text-primary mb-1 fw-bold">${op.makers.length} Autori</div>` : '';
//         const currentText = ((_b = op.artisticCurrents) === null || _b === void 0 ? void 0 : _b.length) ?
//             `<div class="chip-container mb-2">${op.artisticCurrents.map((c) => `<span class="chip" style="font-size:0.6rem">${c}</span>`).join('')}</div>` : '';
//         col.innerHTML = `
//             <div class="card card-opera h-100 shadow-sm p-3">
//                 <div class="card-body d-flex flex-column p-2">
//                     <div class="d-flex justify-content-between mb-2">
//                         <h5 class="fw-bold mb-0 text-dark">${op.title}</h5>
//                         <span class="badge bg-light text-secondary border rounded-pill small">${((_c = op.details) === null || _c === void 0 ? void 0 : _c.objectType) || 'Opera'}</span>
//                     </div>
//                     ${makerText}
//                     <p class="text-muted small mb-3 flex-grow-1">${op.description || 'Nessuna descrizione.'}</p>
//                     ${currentText}
//                     <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
//                         <button class="btn btn-sm text-danger fw-bold p-0 delete-btn"><i class="bi bi-trash-fill"></i></button>
//                         <small class="text-uppercase fw-bold text-muted" style="font-size:0.6rem">${op.id.slice(-6)}</small>
//                     </div>
//                 </div>
//             </div>
//         `;
//         (_d = col.querySelector('.delete-btn')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => remove(op.id));
//         return col;
//     }
//     (_a = document.getElementById('refresh')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', load);
//     load();
// });
