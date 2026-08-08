const UploadService = require('../../service/UploadService');
const Imager = require('../../utils/Imager');
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
      const artistId = req.params.artistId || req.query.artistId || req.body?.artistId;
      const isMeta = req.path.includes('/meta') || req.query.isMeta === 'true' || req.body?.isMeta === 'true';
      const userId = req.path.include('/propic'); // check

      const uploadOptions = { museumId, visitId, artworkId, artistid, isMeta, userId };
      const savedFiles = [];

      for (const file of files) {
        const saved;
        if (Imager.isImage(file)) {
          if (!museumId) {
            if (userId) {
              this.handlePropicUpload(uploadOptions, file, savedFiles);
            } else {
              console.error("Error: bad request")
              return res.status(400).json({ message: 'Errore upload consentiti: profile picture and museum related pictures!'})
            }
          } else {
            this.handleMuseumUpload(uploadOptions, file, savedFiles);
          }
        }
          
      }
      return res.status(201).json({
        success: true,
        message: 'File caricati con successo.',
        count: savedFiles.length,
        files: savedFiles
      });
    } catch (err) {
      console.error('[UploadController Error]:', err);
      return res.status(500).json({ message: err.message || 'Errore durante il caricamento del file.' });
    }
  }

  static async handleMuseumUpload(uploadOptions, fileToSave, savedFiles) {
    const savedFile = await UploadService.saveMuseumRelatedImage(
      fileToSave.buffer,
      fileToSave.originalname,
      fileToSave.mimetype,
      uploadOptions
    );
    savedFiles.push(savedFile);
  }

  static async handlePropicUpload(uploadOptions, fileToSave, savedFiles) {
    const savedFile = await UploadService.savePropicImage(
      fileToSave.buffer,
      fileToSave.originalname,
      fileToSave.mimetype,
      uploadOptions
    );
    savedFiles.push(savedFile);
  }
}

module.exports = UploadController;
