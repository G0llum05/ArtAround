import { MuseumService } from '../services/museum.service.js';
import { MuseumViews } from '../views/museum.js';

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
        try {
            app.container.innerHTML = MuseumViews.add();

            const form = app.container.querySelector('#add-museum-form');
            form.addEventListener('submit', async (evnt) => {
                evnt.preventDefault();
                const formData = new FormData(form);
                const name = formData.get('name');
                const description = formData.get('description');
                const addressObj = {
                    street: formData.get('address.street'),
                    city: formData.get('address.city'),
                    zipCode: formData.get('address.zipCode'),
                    country: formData.get('address.country')
                };
                const contactObj = {
                    phone: formData.get('contact.phone'),
                    email: formData.get('contact.email'),
                    website: formData.get('contact.website')
                };
                const maxCapacity = formData.get('maxCapacity');
                const requirements = formData.get('requirements');
                const isActive = formData.get('isActive');
                const disableFriendly = formData.get('disableFriendly');
                // visits will be added in the dedicated page

                const payload = {
                    name,
                    description,
                    address: addressObj,
                    contact: contactObj,
                    maxCapacity: Number(maxCapacity),
                    requirements,
                    isActive: !!isActive,
                    disableFriendly: !!disableFriendly
                };

                try {
                    const response = await MuseumService.create(payload, app._fetch.bind(app));
                    if (!response.ok) {
                        const errorData = await reponse.json();
                        throw new Error(errorData.message || 'Errore nella creazione dell\'artista');
                    }
                    const { ShellRouter } = await import('../../shell/shell-router.js');
                    ShellRouter.navigate('/marketplace/museums');
                } catch (err) {
                    alert(`Errore: ${err.message}`);
                }
            });
        } catch (err) {
            app.container.innerHTML = ArtistViews.error(err);
        }
    }
}