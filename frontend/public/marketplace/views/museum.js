export const MuseumViews = {
    museum(museums = []) {
        console.log('Rendering museum view with museums:', museums);
        const museumList = museums.map(museum => `
            <div class="mkt-item">
                <p>${museum.name}</p>
            </div>
        `).join('');

        return `
            <div class="mkt-container">
                <h1 class="mkt-title">Musei ArtAround</h1>
                <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
                <br>
                <a class="mkt-link" data-navigate="/marketplace/museums/add">Aggiungi Museo</a>
                <div class="mkt-list">
                    ${museums.length > 0 ? museumList : '<p>Nessun museo trovato</p>'}
                </div>
            </div>
        `;
    },

    addWizard() {
        return `
            <div class="mkt-container">
                <a class="mkt-back" data-navigate="/marketplace/museums">← Torna ai musei</a>
                <form class="mkt-form" id="add-museum-form">
                    <h1 class="mkt-title">Aggiungi Museo</h1>
                    <div id="wizard-steps"></div>
                </form>
            </div>
        `;
    },

    _addStep1(data = {}) {
        return `
            <div class="wizard-step" data-step="1">
                <h2>Dati Generali</h2>
                
                <div class="mkt-field">
                    <label for="name">Nome</label>
                    <input type="text" id="name" name="name" value="${data.name || ''}" required>
                </div>
                
                <div class="mkt-field">
                    <label for="description">Descrizione</label>
                    <textarea id="description" name="description">${data.description || ''}</textarea>
                </div>

                <div class="profile-form">
                    <h3>Indirizzo</h3>
                    <div class="mkt-field">
                        <input type="text" id="addressSearch" name="addressSearch" placeholder="Inizia a scrivere la via..." value="${data.address?.street || ''}">
                    </div>
                    <div id="results" class="autocomplete-box"></div>
                    <div id="addressFields">
                        <input type="hidden" id="street" name="address.street" value="${data.address?.street || ''}">
                        <div class="mkt-field">
                        <div class="mkt-field mkt-civ">
                            <input type="text" id="civ" name="address.civ" placeholder="Numero civico" value="${data.address?.civ || ''}">
                        </div>
                            <input type="text" id="city" name="address.city" placeholder="Città" value="${data.address?.city || ''}" readonly>
                        </div>
                        <div class="mkt-field">
                            <input type="text" id="zipCode" name="address.zipCode" placeholder="CAP" value="${data.address?.zipCode || ''}" readonly>
                        </div>
                        <div class="mkt-field">
                            <input type="text" id="country" name="address.country" placeholder="Nazione" value="${data.address?.country || ''}" readonly>
                        </div>
                    </div>
                </div>

                <h3>Contatti</h3>
                <div class="mkt-field">
                    <label for="phone">Telefono</label>
                    <input type="tel" id="phone" name="contact.phone" value="${data.contact?.phone || ''}">
                </div>
                <div class="mkt-field">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="contact.email" value="${data.contact?.email || ''}">
                </div>
                <div class="mkt-field">
                    <label for="website">Sito Web</label>
                    <input type="url" id="website" name="contact.website" value="${data.contact?.website || ''}">
                </div>

                <h3>Dettagli</h3>
                <div class="mkt-field">
                    <label for="maxCapacity">Capacità Massima</label>
                    <input type="number" id="maxCapacity" name="maxCapacity" value="${data.maxCapacity || ''}">
                </div>
                <div class="mkt-field">
                    <label for="requirements">Requisiti di visita</label>
                    <textarea id="requirements" name="requirements">${data.requirements || ''}</textarea>
                </div>
                <div class="mkt-field mkt-checkbox">
                    <input type="checkbox" id="isActive" name="isActive" ${data.isActive ? 'checked' : ''}>
                    <label for="isActive">Attivo</label>
                </div>
                <div class="mkt-field mkt-checkbox">
                    <input type="checkbox" id="disableFriendly" name="disableFriendly" ${data.disableFriendly ? 'checked' : ''}>
                    <label for="disableFriendly">Accessibile ai disabili</label>
                </div>

                <div class="mkt-wizard-controls">
                    <button type="button" class="mkt-button" id="next-step">Avanti</button>
                </div>
            </div>
        `;
    },

    _addStep2(data = {}) {
        return `
            <div class="wizard-step" data-step="2">
                <h2>Orari Settimanali</h2>
                <div id="weeklyContainer"></div>
                <div class="mkt-wizard-controls">
                    <button type="button" class="mkt-button" id="prev-step">Indietro</button>
                    <button type="button" class="mkt-button" id="next-step">Avanti</button>
                </div>
            </div>
        `;
    },

    _addStep3(data = {}) {
        const schedule = data.openingHours?.weeklyStandard || [];
        const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
        return `
            <div class="wizard-step" data-step="3">
                <h2>Riepilogo</h2>
                <div class="recap-section">
                    <h3>Dati Generali</h3>
                    <p><strong>Nome:</strong> ${data.name || ''}</p>
                    <p><strong>Descrizione:</strong> ${data.description || ''}</p>
                </div>
                <div class="recap-section">
                    <h3>Indirizzo</h3>
                    <p>${data.address?.street || ''}, ${data.address?.city || ''}, ${data.address?.zipCode || ''}, ${data.address?.country || ''}</p>
                </div>
                <div class="recap-section">
                    <h3>Contatti</h3>
                    <p><strong>Tel:</strong> ${data.contact?.phone || ''}</p>
                    <p><strong>Email:</strong> ${data.contact?.email || ''}</p>
                    <p><strong>Sito:</strong> <a href="${data.contact?.website || ''}" target="_blank">${data.contact?.website || ''}</a></p>
                </div>
                <div class="recap-section">
                    <h3>Orari</h3>
                    <ul>
                        ${schedule.map(day => `
                            <li>
                                <strong>${days[day.day]}:</strong> 
                                ${day.closed ? 'Chiuso' : day.slots.map(slot => `${slot.startTime} - ${slot.endTime}`).join(', ')}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="mkt-wizard-controls">
                    <button type="button" class="mkt-button" id="prev-step">Indietro</button>
                    <button type="submit" class="mkt-button">Crea Museo</button>
                </div>
            </div>
        `;
    },

    error(err) {
        return `<div class="mkt-error"> \${err.message} </div>`
    }
};