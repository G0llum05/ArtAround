import Uppy from 'https://cdn.jsdelivr.net/npm/@uppy/core@5.2.0/+esm';
import DragDrop from 'https://cdn.jsdelivr.net/npm/@uppy/drag-drop@5.1.0/+esm';

export class MktImageUploader extends HTMLElement {
  constructor() {
    super();
    this.uppy = null;
    this.previewUrlMap = new Map();
    this.files = [];

    // Default configuration values
    this._allowedFileTypes = ['image/*'];
    this._maxFileSize = 10 * 1024 * 1024; // 10 MB
    this._maxNumberOfFiles = null;
    this._minNumberOfFiles = null;
    this._autoProceed = false;
    this._allowMultipleFiles = true;
    this._inputName = 'files[]';
    this._width = '100%';
    this._height = '100%';
    this._note = null;
    this._showPreview = true;
    this._dropHereOr = 'Drop here or %{browse}';
    this._browse = 'browse';
  }

  static get observedAttributes() {
    return [
      'allowed-file-types',
      'max-file-size',
      'max-number-of-files',
      'min-number-of-files',
      'auto-proceed',
      'allow-multiple-files',
      'input-name',
      'width',
      'height',
      'note',
      'show-preview',
      'drop-here-or',
      'browse',
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'allowed-file-types':
        this._allowedFileTypes = newValue ? newValue.split(',').map((s) => s.trim()) : ['image/*'];
        break;
      case 'max-file-size':
        this._maxFileSize = newValue ? parseInt(newValue, 10) : 10 * 1024 * 1024;
        break;
      case 'max-number-of-files':
        this._maxNumberOfFiles = newValue ? parseInt(newValue, 10) : null;
        break;
      case 'min-number-of-files':
        this._minNumberOfFiles = newValue ? parseInt(newValue, 10) : null;
        break;
      case 'auto-proceed':
        this._autoProceed = newValue === '' || newValue === 'true';
        break;
      case 'allow-multiple-files':
        this._allowMultipleFiles = newValue !== 'false';
        break;
      case 'input-name':
        this._inputName = newValue || 'files[]';
        break;
      case 'width':
        this._width = newValue || '100%';
        break;
      case 'height':
        this._height = newValue || '100%';
        break;
      case 'note':
        this._note = newValue;
        break;
      case 'show-preview':
        this._showPreview = newValue !== 'false';
        break;
      case 'drop-here-or':
        this._dropHereOr = newValue || 'Drop here or %{browse}';
        break;
      case 'browse':
        this._browse = newValue || 'browse';
        break;
    }
  }

  // Getters and setters for JavaScript property access
  get allowedFileTypes() { return this._allowedFileTypes; }
  set allowedFileTypes(val) { this._allowedFileTypes = val; }

  get maxFileSize() { return this._maxFileSize; }
  set maxFileSize(val) { this._maxFileSize = val; }

  get maxNumberOfFiles() { return this._maxNumberOfFiles; }
  set maxNumberOfFiles(val) { this._maxNumberOfFiles = val; }

  get minNumberOfFiles() { return this._minNumberOfFiles; }
  set minNumberOfFiles(val) { this._minNumberOfFiles = val; }

  get autoProceed() { return this._autoProceed; }
  set autoProceed(val) { this._autoProceed = val; }

  get allowMultipleFiles() { return this._allowMultipleFiles; }
  set allowMultipleFiles(val) { this._allowMultipleFiles = val; }

  get inputName() { return this._inputName; }
  set inputName(val) { this._inputName = val; }

  get width() { return this._width; }
  set width(val) { this._width = val; }

  get height() { return this._height; }
  set height(val) { this._height = val; }

  get note() { return this._note; }
  set note(val) { this._note = val; }

  get showPreview() { return this._showPreview; }
  set showPreview(val) { this._showPreview = val; }

  get dropHereOr() { return this._dropHereOr; }
  set dropHereOr(val) { this._dropHereOr = val; }

  get browse() { return this._browse; }
  set browse(val) { this._browse = val; }

  connectedCallback() {
    this.render();
    this.initUppy();
  }

  disconnectedCallback() {
    this.cleanupPreviewUrls();
    if (this.uppy) {
      this.uppy.destroy();
      this.uppy = null;
    }
  }

  render() {
    this.innerHTML = `
      <div class="image-uploader-wrapper">
        <!-- Container mount per Uppy Drag & Drop -->
        <div class="uppy-drag-drop-mount"></div>

        <!-- Banner messaggio di errore -->
        <div class="uploader-error-message" style="display: none;" role="alert">
          <svg class="error-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span class="error-text"></span>
        </div>

        <!-- Sezione preview dei file selezionati -->
        <div class="uploaded-files-container" style="display: none;">
          <div class="uploaded-files-header">
            <span class="files-count-label">File selezionati (0)</span>
            <button type="button" class="clear-all-button" title="Rimuovi tutti i file">Rimuovi tutti</button>
          </div>
          <div class="uploaded-files-grid"></div>
        </div>
      </div>
    `;

    const clearAllBtn = this.querySelector('.clear-all-button');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearFiles());
    }
  }

  initUppy() {
    const mountEl = this.querySelector('.uppy-drag-drop-mount');
    if (!mountEl) return;

    // Read initial values from attributes if present
    if (this.hasAttribute('allowed-file-types')) {
      const val = this.getAttribute('allowed-file-types');
      this._allowedFileTypes = val ? val.split(',').map((s) => s.trim()) : ['image/*'];
    }
    if (this.hasAttribute('max-file-size')) {
      this._maxFileSize = parseInt(this.getAttribute('max-file-size'), 10) || this._maxFileSize;
    }
    if (this.hasAttribute('max-number-of-files')) {
      this._maxNumberOfFiles = parseInt(this.getAttribute('max-number-of-files'), 10);
    }
    if (this.hasAttribute('min-number-of-files')) {
      this._minNumberOfFiles = parseInt(this.getAttribute('min-number-of-files'), 10);
    }
    if (this.hasAttribute('allow-multiple-files')) {
      this._allowMultipleFiles = this.getAttribute('allow-multiple-files') !== 'false';
    }
    if (this.hasAttribute('auto-proceed')) {
      this._autoProceed = this.getAttribute('auto-proceed') === 'true';
    }
    if (this.hasAttribute('note')) {
      this._note = this.getAttribute('note');
    }
    if (this.hasAttribute('drop-here-or')) {
      this._dropHereOr = this.getAttribute('drop-here-or');
    }
    if (this.hasAttribute('browse')) {
      this._browse = this.getAttribute('browse');
    }

    const restrictions = {
      maxFileSize: this._maxFileSize,
      allowedFileTypes: this._allowedFileTypes,
    };
    if (this._maxNumberOfFiles !== null) {
      restrictions.maxNumberOfFiles = this._maxNumberOfFiles;
    }
    if (this._minNumberOfFiles !== null) {
      restrictions.minNumberOfFiles = this._minNumberOfFiles;
    }

    this.uppy = new Uppy({
      id: 'mkt-uppy-' + Math.random().toString(36).substring(2, 9),
      autoProceed: this._autoProceed,
      restrictions,
    });

    this.uppy.use(DragDrop, {
      target: mountEl,
      inputName: this._inputName,
      allowMultipleFiles: this._allowMultipleFiles,
      width: this._width,
      height: this._height,
      note: this._note || undefined,
      locale: {
        strings: {
          dropHereOr: this._dropHereOr,
          browse: this._browse,
        },
      },
      onDragOver: (event) => {
        mountEl.classList.add('is-dragging');
        this.dispatchEvent(new CustomEvent('dragOver', { detail: event, bubbles: true, composed: true }));
      },
      onDragLeave: (event) => {
        mountEl.classList.remove('is-dragging');
        this.dispatchEvent(new CustomEvent('dragLeave', { detail: event, bubbles: true, composed: true }));
      },
      onDrop: (event) => {
        mountEl.classList.remove('is-dragging');
        this.dispatchEvent(new CustomEvent('drop', { detail: event, bubbles: true, composed: true }));
      },
    });

    this.uppy.on('file-added', (file) => {
      this.clearError();
      this.updateFiles();
      this.dispatchEvent(new CustomEvent('fileAdded', { detail: file, bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('filesChange', { detail: this.getFiles(), bubbles: true, composed: true }));
    });

    this.uppy.on('file-removed', (file) => {
      this.revokePreviewUrl(file.id);
      this.updateFiles();
      this.dispatchEvent(new CustomEvent('fileRemoved', { detail: file, bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('filesChange', { detail: this.getFiles(), bubbles: true, composed: true }));
    });

    this.uppy.on('restriction-failed', (file, error) => {
      const msg = error?.message || 'Restrizione file non rispettata.';
      this.showError(msg);
      this.dispatchEvent(new CustomEvent('restrictionFailed', { detail: { file, error }, bubbles: true, composed: true }));
    });

    this.uppy.on('error', (error) => {
      this.showError(error?.message || 'Errore durante il caricamento del file.');
    });
  }

  showError(message) {
    const errorBanner = this.querySelector('.uploader-error-message');
    const errorText = this.querySelector('.error-text');
    if (errorBanner && errorText) {
      errorText.textContent = message;
      errorBanner.style.display = 'flex';
    }
  }

  clearError() {
    const errorBanner = this.querySelector('.uploader-error-message');
    if (errorBanner) {
      errorBanner.style.display = 'none';
    }
  }

  updateFiles() {
    if (!this.uppy) return;
    this.files = this.uppy.getFiles();
    this.renderPreviews();
  }

  renderPreviews() {
    const showPreview = this._showPreview;
    const container = this.querySelector('.uploaded-files-container');
    const countLabel = this.querySelector('.files-count-label');
    const grid = this.querySelector('.uploaded-files-grid');

    if (!container || !grid) return;

    if (!showPreview || this.files.length === 0) {
      container.style.display = 'none';
      grid.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    if (countLabel) {
      countLabel.textContent = `File selezionati (${this.files.length})`;
    }

    grid.innerHTML = this.files
      .map((file) => {
        const previewUrl = this.getFilePreview(file);
        const formattedSize = this.formatFileSize(file.size);

        return `
          <div class="file-preview-card" data-file-id="${file.id}">
            <div class="file-thumbnail-wrapper">
              ${
                previewUrl
                  ? `<img src="${previewUrl}" alt="${file.name}" class="file-thumbnail-img" />`
                  : `<div class="file-thumbnail-placeholder">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>`
              }
            </div>
            <div class="file-info">
              <span class="file-name" title="${file.name}">${file.name}</span>
              <span class="file-size">${formattedSize}</span>
            </div>
            <button type="button" class="remove-file-button" data-file-id="${file.id}" aria-label="Rimuovi ${file.name}" title="Rimuovi file">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `;
      })
      .join('');

    const removeBtns = grid.querySelectorAll('.remove-file-button');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.getAttribute('data-file-id');
        if (fileId) this.removeFile(fileId);
      });
    });
  }

  getFilePreview(file) {
    if (file.preview) {
      return file.preview;
    }
    if (file.data instanceof Blob || file.data instanceof File) {
      if (!this.previewUrlMap.has(file.id)) {
        const url = URL.createObjectURL(file.data);
        this.previewUrlMap.set(file.id, url);
      }
      return this.previewUrlMap.get(file.id) || null;
    }
    return null;
  }

  revokePreviewUrl(fileId) {
    const url = this.previewUrlMap.get(fileId);
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrlMap.delete(fileId);
    }
  }

  cleanupPreviewUrls() {
    this.previewUrlMap.forEach((url) => URL.revokeObjectURL(url));
    this.previewUrlMap.clear();
  }

  removeFile(fileId) {
    if (this.uppy) {
      this.uppy.removeFile(fileId);
    }
  }

  clearFiles() {
    if (this.uppy) {
      this.uppy.cancelAll();
      this.cleanupPreviewUrls();
      this.files = [];
      this.clearError();
      this.renderPreviews();
      this.dispatchEvent(new CustomEvent('filesChange', { detail: [], bubbles: true, composed: true }));
    }
  }

  getFiles() {
    return this.uppy ? this.uppy.getFiles() : [];
  }

  getUppyInstance() {
    return this.uppy;
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
