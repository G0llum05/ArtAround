const CSS_ID = 'weekly-schedule-styles';
const CSS_PATH = './styles/weekly.schedule.css';

export const WeeklyScheduleService = {

    // Variabili di stato per il drag
    _isDragging: false,
    _dragMode: null,

    // Riferimenti ai listener per il teardown
    _mouseDownHandler: null,
    _mouseOverHandler: null,
    _mouseUpHandler: null,
    _containerRef: null,

    init(container, schedule = {}) {
        this._containerRef = container.querySelector('#weeklyContainer');

        // 1. CARICAMENTO DINAMICO DELLO STILE
        if (!document.getElementById(CSS_ID)) {
            const link = document.createElement('link');
            link.id = CSS_ID;
            link.rel = 'stylesheet';
            link.href = CSS_PATH;
            document.head.appendChild(link);
        }

        const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
        const weeklyStandard = schedule.weeklyStandard || [];

        // 2. Costruzione HTML
        let html = `<div class="schedule-container">`;
        html += `<div class="grid-header-corner"></div>`;

        days.forEach(day => {
            html += `<div class="grid-header text-center fw-bold">${day}</div>`;
        });

        let maxHour = 22;
        for (let hour = 7; hour < maxHour; hour++) {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            html += `<div class="grid-label text-muted">${hourLabel}</div>`;

            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const isActive = this._isHourActive(dayIndex, hour, weeklyStandard);
                const bgClass = isActive ? 'bg-success' : 'bg-white';

                html += `
                    <div class="time-slot border rounded-1 ${bgClass}" 
                         data-day="${dayIndex}" 
                         data-hour="${hour}">
                    </div>`;
            }
        }
        html += `   <div class="grid-label text-muted">${maxHour}:00</div>`;
        html += `</div>`;
        this._containerRef.innerHTML = html;

        // 3. EVENT DELEGATION PER IL DRAG & DROP

        // A. Quando premi il mouse su una cella
        this._mouseDownHandler = (e) => {
            if (e.target.classList.contains('time-slot')) {
                this._isDragging = true;
                // Capiamo se stiamo "pennellando" o "cancellando" in base alla prima cella
                const isAlreadyActive = e.target.classList.contains('bg-success');
                this._dragMode = isAlreadyActive ? 'remove' : 'add';

                this._applyDragState(e.target);

                // Fondamentale: impedisce al browser di selezionare il testo mentre trascini
                e.preventDefault();
            }
        };

        // B. Quando passi sopra le altre celle tenendo premuto
        this._mouseOverHandler = (e) => {
            if (this._isDragging && e.target.classList.contains('time-slot')) {
                this._applyDragState(e.target);
            }
        };

        // C. Quando rilasci il mouse (lo mettiamo sul document intero!)
        this._mouseUpHandler = () => {
            this._isDragging = false;
            this._dragMode = null;
        };

        // Attacchiamo gli eventi
        this._containerRef.addEventListener('mousedown', this._mouseDownHandler);
        this._containerRef.addEventListener('mouseover', this._mouseOverHandler);

        // Mettiamo il mouseup sul document. 
        // Perché? Se inizi a trascinare, esci fuori dalla griglia e rilasci il mouse, 
        // il drag deve fermarsi. Se lo mettessimo sul container, rimarrebbe "incantato".
        document.addEventListener('mouseup', this._mouseUpHandler);
    },

    getData() {
        if (!this._containerRef) return { weeklyStandard: [], exceptions: [] };

        const weeklyStandard = [];

        for (let day = 0; day < 7; day++) {
            const activeCells = this._containerRef.querySelectorAll(`.time-slot.bg-success[data-day="${day}"]`);
            const activeHours = Array.from(activeCells).map(cell => parseInt(cell.dataset.hour));

            if (activeHours.length === 0) {
                weeklyStandard.push({ day, closed: true, slots: [] });
            } else {
                const slots = this._hoursToSlots(activeHours);
                weeklyStandard.push({ day, closed: false, slots });
            }
        }

        return { weeklyStandard, exceptions: [] };
    },

    teardown() {
        // Rimuovi i listener del mouse
        if (this._containerRef) {
            this._containerRef.removeEventListener('mousedown', this._mouseDownHandler);
            this._containerRef.removeEventListener('mouseover', this._mouseOverHandler);
        }
        // Ricordati di rimuovere quello sul document!
        document.removeEventListener('mouseup', this._mouseUpHandler);

        if (this._containerRef) {
            this._containerRef.innerHTML = '';
        }

        const cssLink = document.getElementById(CSS_ID);
        if (cssLink) {
            cssLink.remove();
        }

        // Resetta le variabili interne
        this._isDragging = false;
        this._dragMode = null;
        this._mouseDownHandler = null;
        this._mouseOverHandler = null;
        this._mouseUpHandler = null;
        this._containerRef = null;
    },

    // --- HELPER PRIVATI ---

    // Nuovo helper che applica lo stato colore in base al dragMode
    _applyDragState(cell) {
        if (this._dragMode === 'add') {
            cell.classList.remove('bg-white');
            cell.classList.add('bg-success');
        } else if (this._dragMode === 'remove') {
            cell.classList.remove('bg-success');
            cell.classList.add('bg-white');
        }
    },

    _isHourActive(dayIndex, hour, weeklyStandard) {
        const dayData = weeklyStandard.find(d => d.day === dayIndex);
        if (!dayData || dayData.closed) return false;

        return dayData.slots.some(slot => {
            const startH = parseInt(slot.startTime.split(':')[0]);
            const endH = parseInt(slot.endTime.split(':')[0]);
            return hour >= startH && hour < endH;
        });
    },

    _hoursToSlots(hoursArray) {
        const sorted = [...hoursArray].sort((a, b) => a - b);
        const slots = [];
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i <= sorted.length; i++) {
            if (i === sorted.length || sorted[i] !== prev + 1) {
                slots.push({
                    startTime: `${start.toString().padStart(2, '0')}:00`,
                    endTime: `${(prev + 1).toString().padStart(2, '0')}:00`
                });

                if (i < sorted.length) {
                    start = sorted[i];
                    prev = sorted[i];
                }
            } else {
                prev = sorted[i];
            }
        }
        return slots;
    }
};