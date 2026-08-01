/**
 * Vanilla JS Service to manage Uppy.js Dashboard & XHRUpload
 */
export const UppyService = {
    instance: null,

    /**
     * Initializes Uppy instance on the given HTML container.
     * Dynamically loads Uppy stylesheet and ESM scripts if not present.
     */
    async init(container, museumId, onUploadSuccessCallback) {
        this.destroy();

        if (!container) return;

        // Ensure Uppy CSS stylesheet is loaded
        if (!document.getElementById('uppy-css-link')) {
            const link = document.createElement('link');
            link.id = 'uppy-css-link';
            link.rel = 'stylesheet';
            link.href = 'https://releases.transloadit.com/uppy/v3.27.0/uppy.min.css';
            document.head.appendChild(link);
        }

        try {
            // Import Uppy ESM modules dynamically from CDN
            const { Uppy, Dashboard, XHRUpload } = await import('https://releases.transloadit.com/uppy/v3.27.0/uppy.min.mjs');

            const targetId = museumId || 'meta';
            const endpoint = `/api/upload/museum/${targetId}/meta`;

            this.instance = new Uppy({
                id: 'museum-meta-uppy',
                autoProceed: false,
                restrictions: {
                    maxFileSize: 20 * 1024 * 1024, // 20MB
                    allowedFileTypes: ['image/*']
                }
            })
            .use(Dashboard, {
                target: container,
                inline: true,
                height: 350,
                width: '100%',
                showProgressDetails: true,
                note: `Le immagini verranno salvate in assets/museums/${targetId}/meta e convertite in WebP`,
                locale: {
                    strings: {
                        dropPasteFiles: 'Trascina qui i file o %{browseFiles}',
                        browseFiles: 'sfoglia dal dispositivo',
                        uploadXFiles: { 0: 'Carica %{smart_count} file', 1: 'Carica %{smart_count} file' },
                        uploadingXFiles: { 0: 'Caricamento %{smart_count} file', 1: 'Caricamento %{smart_count} file' },
                        complete: 'Caricamento completato'
                    }
                }
            })
            .use(XHRUpload, {
                endpoint: endpoint,
                fieldName: 'files',
                formData: true,
                bundle: true,
                withCredentials: true
            });

            this.instance.on('complete', (result) => {
                if (result.successful && result.successful.length > 0) {
                    const uploadedFiles = result.successful
                        .map(f => f.response?.body?.files || [])
                        .flat();

                    if (onUploadSuccessCallback) {
                        onUploadSuccessCallback(uploadedFiles);
                    }
                }
            });

            return this.instance;
        } catch (err) {
            console.error('[UppyService Error]:', err);
            container.innerHTML = `<div class="mkt-error">Impossibile inizializzare Uppy.js: ${err.message}</div>`;
        }
    },

    destroy() {
        if (this.instance) {
            try {
                this.instance.destroy();
            } catch (e) {
                console.warn('Errore durante la distruzione di Uppy:', e);
            }
            this.instance = null;
        }
    }
};
