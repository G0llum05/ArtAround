const UploadService = require('../../service/UploadService');
const UploadMapper = require('../../data/mapper/UploadMapper');

class UploadController {
  /**
   * Caricamento immagine del museo (meta/copertina)
   */
  static async museumImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadMuseumImgDTO(req);
      if (!uploadDTO || !uploadDTO.museumId || !uploadDTO.file) {
        return res.status(400).json({
          message: 'Errore: dati di caricamento non validi.',
          details: {
            museumId: uploadDTO?.museumId || null,
            hasFile: !!uploadDTO?.file,
            orientation: uploadDTO?.orientation || null
          }
        });
      }

      const url = await UploadService.museumImgUpload(
        uploadDTO.museumId,
        uploadDTO.file,
        uploadDTO.orientation
      );

      return res.status(201).json({
        message: 'Immagine del museo caricata con successo.',
        url
      });
    } catch (err) {
      console.error('[UploadController museumImgUpload Error]:', err);
      return res.status(400).json({
        message: 'Errore durante il caricamento dell\'immagine del museo.',
        error: err.message
      });
    }
  }

  /**
   * Caricamento immagine della visita (meta/copertina)
   */
  static async visitImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadVisitImgDTO(req);
      if (!uploadDTO || !uploadDTO.visitId || !uploadDTO.file) {
        return res.status(400).json({
          message: 'Errore: dati di caricamento non validi.',
          details: {
            museumId: uploadDTO?.museumId || null,
            visitId: uploadDTO?.visitId || null,
            hasFile: !!uploadDTO?.file,
            orientation: uploadDTO?.orientation || null
          }
        });
      }

      const url = await UploadService.visitImgUpload(
        uploadDTO.museumId,
        uploadDTO.visitId,
        uploadDTO.file,
        uploadDTO.orientation
      );

      return res.status(201).json({
        message: 'Immagine della visita caricata con successo.',
        url
      });
    } catch (err) {
      console.error('[UploadController visitImgUpload Error]:', err);
      return res.status(400).json({
        message: 'Errore durante il caricamento dell\'immagine della visita.',
        error: err.message
      });
    }
  }

  /**
   * Caricamento immagine dell'opera d'arte (artwork)
   */
  static async artworkImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadArtworkImgDTO(req);
      if (!uploadDTO || !uploadDTO.artworkId || !uploadDTO.file) {
        return res.status(400).json({
          message: 'Errore: dati di caricamento non validi.',
          details: {
            museumId: uploadDTO?.museumId || null,
            artworkId: uploadDTO?.artworkId || null,
            hasFile: !!uploadDTO?.file,
            orientation: uploadDTO?.orientation || null
          }
        });
      }

      const url = await UploadService.artworkImgUpload(
        uploadDTO.museumId,
        uploadDTO.artworkId,
        uploadDTO.file,
        uploadDTO.orientation
      );

      return res.status(201).json({
        message: 'Immagine dell\'opera caricata con successo.',
        url
      });
    } catch (err) {
      console.error('[UploadController artworkImgUpload Error]:', err);
      return res.status(400).json({
        message: 'Errore durante il caricamento dell\'immagine dell\'opera.',
        error: err.message
      });
    }
  }

  /**
   * Caricamento immagine dell'artista (decentralizzata, senza museumId)
   */
  static async artistImgUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadArtistImgDTO(req);
      if (!uploadDTO || !uploadDTO.artistId || !uploadDTO.file) {
        return res.status(400).json({
          message: 'Errore: dati di caricamento non validi.',
          details: {
            artistId: uploadDTO?.artistId || null,
            hasFile: !!uploadDTO?.file,
            orientation: uploadDTO?.orientation || null
          }
        });
      }

      const url = await UploadService.artistImgUpload(
        uploadDTO.artistId,
        uploadDTO.file,
        uploadDTO.orientation
      );

      return res.status(201).json({
        message: 'Immagine dell\'artista caricata con successo.',
        url
      });
    } catch (err) {
      console.error('[UploadController artistImgUpload Error]:', err);
      return res.status(400).json({
        message: 'Errore durante il caricamento dell\'immagine dell\'artista.',
        error: err.message
      });
    }
  }

  /**
   * Caricamento immagine del profilo utente (propic)
   */
  static async userPropicUpload(req, res) {
    try {
      const uploadDTO = UploadMapper.toUploadUserPropicDTO(req);
      if (!uploadDTO || !uploadDTO.userId || !uploadDTO.file) {
        return res.status(400).json({
          message: 'Errore: dati di caricamento non validi.',
          details: {
            userId: uploadDTO?.userId || null,
            hasFile: !!uploadDTO?.file,
            orientation: uploadDTO?.orientation || null
          }
        });
      }

      const url = await UploadService.userPropicUpload(
        uploadDTO.userId,
        uploadDTO.file,
        uploadDTO.orientation
      );

      return res.status(201).json({
        message: 'Foto profilo caricata con successo.',
        url
      });
    } catch (err) {
      console.error('[UploadController userPropicUpload Error]:', err);
      return res.status(400).json({
        message: 'Errore durante il caricamento della foto profilo.',
        error: err.message
      });
    }
  }

  /**
   * Recupero immagine del profilo utente (propic o default)
   */
  static async getUserPropic(req, res) {
    try {
      const userId = req.params?.userId;
      const url = await UploadService.getUserPropic(userId);
      return res.status(200).json({
        url
      });
    } catch (err) {
      console.error('[UploadController getUserPropic Error]:', err);
      return res.status(500).json({
        message: 'Errore durante il recupero della foto profilo.',
        error: err.message
      });
    }
  }

  /**
   * Handler generico di fallback
   */
  static async handleUpload(req, res) {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({
          message: 'Nessun file fornito per il caricamento o pacchetto Multer non presente.'
        });
      }

      const museumId = req.params?.museumId || req.body?.museumId;
      const visitId = req.params?.visitId || req.body?.visitId;
      const artworkId = req.params?.artworkId || req.body?.artworkId;
      const artistId = req.params?.artistId || req.body?.artistId;
      const userId = req.params?.userId || req.body?.userId;
      const isPropic = req.path.includes('/propic') || (!museumId && !!userId);
      const orientation = req.body?.orientation;

      const savedFiles = [];

      for (const file of files) {
        if (isPropic) {
          const url = await UploadService.userPropicUpload(userId, file, orientation);
          savedFiles.push({ url });
        } else if (artworkId) {
          const url = await UploadService.artworkImgUpload(museumId, artworkId, file, orientation);
          savedFiles.push({ url });
        } else if (artistId) {
          const url = await UploadService.artistImgUpload(artistId, file, orientation);
          savedFiles.push({ url });
        } else if (visitId) {
          const url = await UploadService.visitImgUpload(museumId, visitId, file, orientation);
          savedFiles.push({ url });
        } else if (museumId) {
          const url = await UploadService.museumImgUpload(museumId, file, orientation);
          savedFiles.push({ url });
        } else {
          return res.status(400).json({
            message: 'Errore caricamento: parametri insufficienti per determinare la risorsa di destinazione.'
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
      console.error('[UploadController handleUpload Error]:', err);
      return res.status(500).json({ message: err.message || 'Errore durante il caricamento del file.' });
    }
  }
}

module.exports = UploadController;
