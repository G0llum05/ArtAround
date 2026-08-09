export const AddressResolutionService = {
    init(container) {
        const addressInput = container.querySelector('#addressSearch');
        const streetInput = container.querySelector('#street');
        const resultsBox = container.querySelector('#results');
        let focusedIndex = -1;
        let currentFeatures = [];

        const selectAddress = (p) => {
            container.querySelector('#addressSearch').value = p.street || p.name || '';
            streetInput.value = p.street || '';
            container.querySelector('#civ').value = p.housenumber || '';
            container.querySelector('#city').value = p.city || '';
            container.querySelector('#zipCode').value = p.postcode || '';
            container.querySelector('#country').value = p.country || '';
            resultsBox.innerHTML = '';
            resultsBox.style.display = 'none';
            focusedIndex = -1;
            currentFeatures = [];
        };

        const updateFocus = () => {
            const items = resultsBox.children;
            Array.from(items).forEach((item, index) => {
                if (index === focusedIndex) {
                    item.classList.add('focused');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('focused');
                }
            });
        };

        addressInput.addEventListener('input', async (e) => {
            const query = e.target.value;
            streetInput.value = query; // Sync hidden field with typed value

            if (query.length < 6) {
                resultsBox.innerHTML = '';
                resultsBox.style.display = 'none';
                focusedIndex = -1;
                currentFeatures = [];
                return;
            }

            try {
                const res = await fetch(`https://photon.komoot.io/api/?q=${query}&limit=5`);
                const data = await res.json();
                currentFeatures = data.features;
                focusedIndex = -1;

                resultsBox.innerHTML = '';
                resultsBox.style.display = 'block';

                currentFeatures.forEach((f, index) => {
                    const props = f.properties;
                    const resultText = [props.name, props.street, props.housenumber, props.postcode, props.city, props.country]
                        .filter(Boolean).join(', ');

                    if (!resultText) return;

                    const item = document.createElement('div');
                    item.className = 'result-item';
                    item.textContent = resultText;
                    item.addEventListener('click', () => selectAddress(props));
                    item.addEventListener('mouseover', () => {
                        focusedIndex = index;
                        updateFocus();
                    });
                    resultsBox.appendChild(item);
                });
            } catch (error) {
                console.error('Error fetching address:', error);
                resultsBox.innerHTML = '<div class="result-item">Errore di rete</div>';
            }
        });

        addressInput.addEventListener('keydown', (e) => {
            const items = resultsBox.children;
            if (items.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    focusedIndex = (focusedIndex + 1) % items.length;
                    updateFocus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    focusedIndex = (focusedIndex - 1 + items.length) % items.length;
                    updateFocus();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (focusedIndex > -1) {
                        const selectedFeature = currentFeatures[focusedIndex];
                        if (selectedFeature) {
                            selectAddress(selectedFeature.properties);
                        }
                    }
                    break;
                case 'Escape':
                    resultsBox.style.display = 'none';
                    focusedIndex = -1;
                    break;
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                resultsBox.style.display = 'none';
                focusedIndex = -1;
            }
        });
    }
};