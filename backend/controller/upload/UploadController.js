const UploadService = require('../../service/UploadService');

class UploadController {
  static async handleUpload(req, res) {
    try {
      console.log('[UploadController] Content-Type:', req.headers['content-type']);
      console.log('[UploadController] req.files length:', req.files ? req.files.length : 0);

      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        console.warn('[UploadController 400] Nessun file intercettato da Multer.');
        return res.status(400).json({
          message: 'Nessun file fornito per il caricamento o pacchetto Multer non presente.'
        });
      }

      // Extract parameters from route params, query string, or body
      const museumId = req.params.museumId || req.query.museumId || req.body?.museumId;
      const visitId = req.params.visitId || req.query.visitId || req.body?.visitId;
      const artworkId = req.params.artworkId || req.query.artworkId || req.body?.artworkId;
      const isMeta = req.path.includes('/meta') || req.query.isMeta === 'true' || req.body?.isMeta === 'true';

      if (!museumId) {
        return res.status(400).json({ message: 'Parametro museumId mancante nella richiesta.' });
      }

      const uploadOptions = { museumId, visitId, artworkId, isMeta };
      const savedFiles = [];

      for (const file of files) {
        const saved = await UploadService.processAndSaveFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          uploadOptions
        );
        savedFiles.push(saved);
      }

      return res.status(201).json({
        success: true,
        message: 'File caricati e convertiti in WebP con successo.',
        count: savedFiles.length,
        files: savedFiles
      });
    } catch (err) {
      console.error('[UploadController Error]:', err);
      return res.status(500).json({ message: err.message || 'Errore durante il caricamento del file.' });
    }
  }
}

module.exports = UploadController;
