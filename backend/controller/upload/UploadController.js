const UploadService = require('../../service/UploadService');
const UploadMapper = require('../../data/mapper/UploadMapper');
const Imager = require('../../utils/Imager');

class UploadController {
  /* 
    * caricare un'immagine del museo
    */
  static async museumImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadMuseumImgDTO(req);
      if (!uploadDTO) {
        return res.status(400).json({ message: 'Errore: dati di caricamento non validi.' });
      }
      url = await UploadService.museumImgUpload(uploadDTO);
      return res.status(201).json({ message: 'Immagine del museo caricata con successo.', url });
    } catch (err) {
      console.error('[UploadController museumImgUpload Error]:', err);
      return res.status(500).json({ message: 'Errore durante il caricamento dell\'immagine del museo.' });
    }
  }


  /* 
    * caricare un'immagine della visita
    */
  static async visitImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadVisitImgDTO(req);
      if (!uploadDTO) {
        return res.status(400).json({ message: 'Errore: dati di caricamento non validi.' });
      }

      url = await UploadService.visitImgUpload(uploadDTO);
      return res.status(201).json({ message: 'Immagine della visita caricata con successo.', url });

    } catch (err) {
      console.error('[UploadController visitImgUpload Error]:', err);
      return res.status(500).json({ message: 'Errore durante il caricamento dell\'immagine della visita.' });
    }
  }






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

      // Estrazione parametri da params, query, headers o body
      const museumId = req.params?.museumId;
      const visitId = req.params?.visitId;
      const artworkId = req.params?.artworkId;
      const artistId = req.params?.artistId;
      const userId = req.params?.userId;
      const isMeta = req.path.includes('/meta');
      const isPropic = req.path.includes('/propic');
      const orientation = req.body?.orientation;

      const uploadOptions = { museumId, visitId, artworkId, artistId, userId, isMeta, isPropic, orientation };
      const savedFiles = [];

      for (const file of files) {
        if (isPropic || (!museumId && userId)) {
          await this.handlePropicUpload(uploadOptions, file, savedFiles);
        } else if (museumId) {
          await this.handleMuseumUpload(uploadOptions, file, savedFiles);
        } else {
          console.error("Error: bad request - missing museumId or userId");
          return res.status(400).json({
            message: 'Errore caricamento: specificare un museumId per le risorse del museo o un userId per la propic!'
          });
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
