import { MuseumService } from '../services/museum.service.js';
import { MuseumViews } from '../views/museum.js';
import { AddressResolutionService } from '../services/addressResolution/address.resolution.service.js';
import { WeeklyScheduleService } from '../services/weeklySchedule/weekly.schedule.service.js';

const MUSEUM_FORM_STATE = 'museumFormState';

export const MuseumController = {
    async render(app) {
        app.container.innerHTML = '<p class="mkt-loading">Caricamento in corso...</p>';
        try {
            const museums = await MuseumService.getAll(app._fetch.bind(app));
            app.container.innerHTML = MuseumViews.museum(museums);
        } catch (err) {
            app.container.innerHTML = MuseumViews.error(err);
        }
    },

    async renderAdd(app) {
        let currentStep = 1;
        let museumData = JSON.parse(sessionStorage.getItem(MUSEUM_FORM_STATE)) || {};

        const renderStep = (step) => {
            const wizardStepsContainer = app.container.querySelector('#wizard-steps');
            if (!wizardStepsContainer) {
                console.error('Wizard container not found!');
                return;
            }

            switch (step) {
                case 1:
                    wizardStepsContainer.innerHTML = MuseumViews._addStep1(museumData);
                    AddressResolutionService.init(wizardStepsContainer);
                    break;
                case 2:
                    wizardStepsContainer.innerHTML = MuseumViews._addStep2(museumData);
                    WeeklyScheduleService.init(wizardStepsContainer, museumData.openingHours);
                    break;
                case 3: {
                    const reviewData = JSON.parse(JSON.stringify(museumData));
                    if (reviewData.address) {
                        reviewData.address.street = [reviewData.address.street, reviewData.address.civ].filter(Boolean).join(' ');
                    }
                    wizardStepsContainer.innerHTML = MuseumViews._addStep3(reviewData);
                    break;
                }
            }
            attachStepListeners(step);
        };

        const collectStepData = (step) => {
            const form = app.container.querySelector('#add-museum-form');
            const formData = new FormData(form);

            if (step === 1) {
                museumData = {
                    ...museumData,
                    name: formData.get('name'),
                    description: formData.get('description'),
                    address: {
                        street: form.querySelector('#street').value,
                        civ: form.querySelector('#civ').value,
                        city: form.querySelector('#city').value,
                        zipCode: form.querySelector('#zipCode').value,
                        country: form.querySelector('#country').value
                    },
                    contact: {
                        phone: formData.get('contact.phone'),
                        email: formData.get('contact.email'),
                        website: formData.get('contact.website')
                    },
                    maxCapacity: formData.get('maxCapacity'),
                    requirements: formData.get('requirements'),
                    isActive: form.querySelector('#isActive').checked,
                    disableFriendly: form.querySelector('#disableFriendly').checked,
                };
            } else if (step === 2) {
                const wizardStepsContainer = app.container.querySelector('#wizard-steps');
                museumData.openingHours = WeeklyScheduleService.getData(wizardStepsContainer);
            }
            sessionStorage.setItem(MUSEUM_FORM_STATE, JSON.stringify(museumData));
        };

        const attachStepListeners = (step) => {
            const nextButton = app.container.querySelector('#next-step');
            const prevButton = app.container.querySelector('#prev-step');

            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    collectStepData(step);
                    currentStep++;
                    renderStep(currentStep);
                });
            }

            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    collectStepData(step);
                    currentStep--;
                    renderStep(currentStep);
                });
            }
        };

        try {
            app.container.innerHTML = MuseumViews.addWizard();
            renderStep(currentStep);

            const form = app.container.querySelector('#add-museum-form');
            form.addEventListener('submit', async (evnt) => {
                evnt.preventDefault();
                collectStepData(currentStep);

                const addressForPayload = { ...museumData.address };
                const fullStreet = [addressForPayload.street, addressForPayload.civ].filter(Boolean).join(' ');

                const payload = {
                    ...museumData,
                    address: {
                        street: fullStreet,
                        city: addressForPayload.city,
                        zipCode: addressForPayload.zipCode,
                        country: addressForPayload.country,
                    },
                    maxCapacity: Number(museumData.maxCapacity),
                };
                delete payload.address.civ;

                try {
                    const response = await MuseumService.create(payload, app._fetch.bind(app));
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Errore nella creazione del museo');
                    }
                    sessionStorage.removeItem(MUSEUM_FORM_STATE);
                    const { ShellRouter } = await import('../../shell/shell-router.js');
                    ShellRouter.navigate('/marketplace/museums');
                } catch (err) {
                    alert(`Errore: ${err.message}`);
                }
            });
        } catch (err) {
            console.error(err);
            app.container.innerHTML = MuseumViews.error(err);
        }
    }
};