const path = require('path');
const fs = require('fs');

class UploadController {
  static async handleUpload(req, res) {
    try {
      const { museumId, visitId, artworkId } = req.params;

      let subPath = 'meta';
      if (museumId && visitId && artworkId) {
        subPath = `museum/${museumId}/visit/${visitId}/${artworkId}`;
      } else if (museumId && visitId) {
        subPath = `museum/${museumId}/visit/${visitId}/meta`;
      } else if (museumId && artworkId) {
        subPath = `museum/${museumId}/${artworkId}`;
      } else if (museumId) {
        subPath = `museum/${museumId}/meta`;
      }

      const mockFile = {
        filename: `image_${Date.now()}.webp`,
        originalName: 'upload_image.jpg',
        path: `assets/museums/${subPath}`,
        url: `/assets/museums/${subPath}/image_${Date.now()}.webp`,
        size: 24510,
        mimeType: 'image/webp'
      };

      return res.status(200).json({
        success: true,
        files: [mockFile]
      });
    } catch (err) {
      console.error('[UploadController] Error handling upload:', err);
      return res.status(500).json({ message: 'Errore interno nel caricamento' });
    }
  }
}

module.exports = UploadController;
