export class UploadService {
  static apiUrl = "http://localhost:8000/api/upload";

  /**
   * Carica l'immagine di copertina / meta della visita
   * Percorso backend: assets/museums/:museumId/visit/:visitId/meta/
   * @param {string} museumId - ID del museo
   * @param {string} visitId - ID della visita
   * @param {File|Blob} file - Il file immagine selezionato
   * @param {string} [orientation='landscape'] - Orientamento immagine ('landscape' o 'portrait')
   * @returns {Promise<{ message: string, url: string }>}
   */
  static async uploadVisitMetaImage(museumId, visitId, file, orientation = 'landscape') {
    if (!visitId || !file) {
      throw new Error("visitId e file sono obbligatori per il caricamento dell'immagine.");
    }

    const formData = new FormData();
    formData.append('file', file);
    if (orientation) {
      formData.append('orientation', orientation);
    }

    const endpoint = museumId
      ? `${this.apiUrl}/museum/${museumId}/visit/${visitId}/meta`
      : `${this.apiUrl}/visit/${visitId}/meta`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Errore durante l'upload: ${response.statusText}`);
    }

    return await response.json();
  }
}