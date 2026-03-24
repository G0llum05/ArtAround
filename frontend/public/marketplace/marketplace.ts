/** 
 * REATTIVITÀ: Semplice Signal per gestire lo stato senza ricaricare la pagina
 */
class Signal<T> {
    private _val: T;
    private listeners: ((v: T) => void)[] = [];
    constructor(v: T) { this._val = v; }
    get value() { return this._val; }
    set value(v: T) { this._val = v; this.listeners.forEach(l => l(v)); }
    subscribe(l: (v: T) => void) { this.listeners.push(l); l(this._val); }
}

const API_URL = 'http://localhost:8000/api/opera';

// STATI REATTIVI
const operas = new Signal<any[]>([]);
const makers = new Signal<string[]>([]);
const currents = new Signal<string[]>([]);
const techniques = new Signal<string[]>([]);
const materials = new Signal<string[]>([]);

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const counter = document.getElementById('counter');
    const form = document.getElementById('opera-form') as HTMLFormElement;

    // --- 1. SINCRONIZZAZIONE UI ---
    
    // Griglia opere
    operas.subscribe(list => {
        if (!grid || !counter) return;
        counter.innerText = `${list.length} Opere`;
        grid.innerHTML = '';
        list.forEach(op => grid.appendChild(createCard(op)));
    });

    // Chips per array dinamici
    const syncChips = (signal: Signal<string[]>, containerId: string) => {
        signal.subscribe(items => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = items.map((it, i) => `
                <div class="chip">${it} <i class="bi bi-x-circle-fill" onclick="removeChip('${containerId}', ${i})"></i></div>
            `).join('');
        });
    };

    syncChips(makers, 'makers-chips');
    syncChips(currents, 'currents-chips');
    syncChips(techniques, 'techs-chips');
    syncChips(materials, 'mats-chips');

    // Funzione globale per rimuovere chip (chiamata dall'onclick inline per semplicità)
    (window as any).removeChip = (type: string, index: number) => {
        if (type === 'makers-chips') makers.value = makers.value.filter((_, i) => i !== index);
        if (type === 'currents-chips') currents.value = currents.value.filter((_, i) => i !== index);
        if (type === 'techs-chips') techniques.value = techniques.value.filter((_, i) => i !== index);
        if (type === 'mats-chips') materials.value = materials.value.filter((_, i) => i !== index);
    };

    // --- 2. GESTIONE INPUT ---

    const setupAddBtn = (btnId: string, inputId: string, signal: Signal<string[]>) => {
        document.getElementById(btnId)?.addEventListener('click', () => {
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (input.value) {
                signal.value = [...signal.value, input.value];
                input.value = '';
            }
        });
    };

    setupAddBtn('add-maker-btn', 'maker-id', makers);
    setupAddBtn('add-current-btn', 'current', currents);
    setupAddBtn('add-tech-btn', 'technique', techniques);
    setupAddBtn('add-mat-btn', 'material', materials);

    // --- 3. OPERAZIONI API ---

    async function load() {
        try {
            const res = await fetch(API_URL);
            operas.value = await res.json();
        } catch (e) { console.error(e); }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: (document.getElementById('title') as HTMLInputElement).value,
            description: (document.getElementById('description') as HTMLTextAreaElement).value,
            startYear: Number((document.getElementById('startYear') as HTMLInputElement).value) || undefined,
            endYear: Number((document.getElementById('endYear') as HTMLInputElement).value) || undefined,
            makers: makers.value,
            museum: (document.getElementById('museum') as HTMLInputElement).value || undefined,
            location: {
                room: (document.getElementById('room') as HTMLInputElement).value,
                floor: (document.getElementById('floor') as HTMLInputElement).value,
                building: (document.getElementById('building') as HTMLInputElement).value
            },
            dimensions: {
                height: Number((document.getElementById('h') as HTMLInputElement).value) || undefined,
                width: Number((document.getElementById('w') as HTMLInputElement).value) || undefined,
                depth: Number((document.getElementById('d') as HTMLInputElement).value) || undefined,
                unit: (document.getElementById('unit') as HTMLInputElement).value
            },
            artisticCurrents: currents.value,
            details: {
                objectType: (document.getElementById('objType') as HTMLInputElement).value,
                techniques: techniques.value,
                materials: materials.value
            },
            copyOf: (document.getElementById('copyOf') as HTMLInputElement).value || undefined,
            falsificationOf: (document.getElementById('falsificationOf') as HTMLInputElement).value || undefined
        };

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            form.reset();
            [makers, currents, techniques, materials].forEach(s => s.value = []);
            load();
        }
    });

    async function remove(id: string) {
        if (confirm("Eliminare l'opera?")) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            load();
        }
    }

    // --- 4. RENDER CARD ---

    function createCard(op: any) {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-xl-4';
        
        const makerText = op.makers?.length ? `<div class="small text-primary mb-1 fw-bold">${op.makers.length} Autori</div>` : '';
        const currentText = op.artisticCurrents?.length ? 
            `<div class="chip-container mb-2">${op.artisticCurrents.map((c:string) => `<span class="chip" style="font-size:0.6rem">${c}</span>`).join('')}</div>` : '';

        col.innerHTML = `
            <div class="card card-opera h-100 shadow-sm p-3">
                <div class="card-body d-flex flex-column p-2">
                    <div class="d-flex justify-content-between mb-2">
                        <h5 class="fw-bold mb-0 text-dark">${op.title}</h5>
                        <span class="badge bg-light text-secondary border rounded-pill small">${op.details?.objectType || 'Opera'}</span>
                    </div>
                    ${makerText}
                    <p class="text-muted small mb-3 flex-grow-1">${op.description || 'Nessuna descrizione.'}</p>
                    ${currentText}
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <button class="btn btn-sm text-danger fw-bold p-0 delete-btn"><i class="bi bi-trash-fill"></i></button>
                        <small class="text-uppercase fw-bold text-muted" style="font-size:0.6rem">${op.id.slice(-6)}</small>
                    </div>
                </div>
            </div>
        `;

        col.querySelector('.delete-btn')?.addEventListener('click', () => remove(op.id));
        return col;
    }

    document.getElementById('refresh')?.addEventListener('click', load);
    load();
});
