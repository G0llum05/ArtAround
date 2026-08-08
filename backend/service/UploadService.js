const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const Imager = require('../utils/Imager');
class UploadService {

  static getTargetDirectory({ museumId, visitId, artworkId, artistId, isMeta }) {
    if (!museumId) {
      throw new Error('museumId è obbligatorio per definire il percorso di salvataggio.');
    }
    const baseMuseumDir = path.join(__dirname, '../assets/museums', museumId);


    // Le immagini dell'artwork risiedono in modo centralizzato sotto artworks/:artworkId
    // per permettere a un artwork di far parte di più visite senza duplicazione file
    if (artworkId) {
      return path.join(baseMuseumDir, 'artworks', artworkId);
    }

    if (visitId) {
      // assets/museums/:museumId/visit/:visitId/meta
      return path.join(baseMuseumDir, 'visit', visitId, 'meta');
    }

    if (artistId) {
      // assets/museums/:museumId/visit/:visitId/meta
      return path.join(baseMuseumDir, 'visit', artistId, 'meta');
    }

    // Default: assets/museums/:museumId/meta
    return path.join(baseMuseumDir, 'meta');
  }

  /**
   * Cerca e restituisce tutti i percorsi URL delle immagini presenti su file system per un determinato artworkId.
   * Cerca nella cartella centralizzata:
   */

  static async scanDir(dirPath, foundUrls) {
    if (!(await fs.pathExists(dirPath))) return;
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (Imager.isImage(file)) {
          const fullPath = path.join(dirPath, file);
          const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
          foundUrls.push(`/${relativePath}`);
        }
      }
    } catch (err) {
      console.error(`[UploadService] Errore durante la scansione della cartella ${dirPath}:`, err);
    }
  }
  
  static async getArtworkImages({ museumId, artworkId }) {
    if (!artworkId || !museumId) return [];
    
    let artworkUrls = [];

    const targetDir = path.join(__dirname, '../assets/museums', museumId, 'artworks', artworkId);

    await this.scanDir(targetDir, artworkUrls)
    return Array.from(new Set(artworkUrls));
  }

  static async getArtistImages({ museumId, artistId }) {
    if (!artistId || !museumId) return [];
    
    let artistUrls = [];

    const targetDir = path.join(__dirname, '../assets/museums', museumId, 'artists', artistId);

    await this.scanDir(targetDir, artistUrls)
    return Array.from(new Set(artistUrls));
  }


  /**
   * Resolves base prefix for filename
   */
  static getFilePrefix({ museumId, visitId, artworkId }) {
    if (artworkId) {
      return artworkId;
    }
    if (visitId) {
      return visitId;
    }
    return museumId;
  }

  /**
   * Process and save file buffer.
   * Transpiles image files to WebP format via Sharp.
   */
  static async processAndSaveFile(fileBuffer, originalName, mimeType, options = {}) {
    const targetDir = this.getTargetDirectory(options);

    // 1. Ensure directory exists with fs-extra
    await fs.ensureDir(targetDir);

    const prefix = this.getFilePrefix(options);

    // Find next index for prefix in targetDir
    const existingFiles = await fs.readdir(targetDir);
    const escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const prefixPattern = new RegExp(`^${escapedPrefix}_(\\d+)\\.`, 'i');

    // Multiple indexes -> multiple images for a single artist, artwork, ecc.
    let maxIndex = 0;
    for (const file of existingFiles) {
      if (file.match(prefixPattern)) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) {
          maxIndex = num;
        }
      }
    }
    const nextIndex = maxIndex + 1;

    const isImage = Imager.isImage(originalName);

    let fileName;
    let filePath;
    let finalMimeType;

    // if raster -> webp, if svg -> svg 
    if (Imager.isRaster(isImage, mimeType)) {
      fileName = `${prefix}_${nextIndex}.webp`;
      filePath = path.join(targetDir, fileName);
      finalMimeType = 'image/webp';
      
      await sharp(fileBuffer)
        .webp({ quality: 82, effort: 4 })
        .toFile(filePath);
    } else {
      const ext = Imager.getExt(fileName);
      fileName = `${prefix}_${nextIndex}${ext}`;
      filePath = path.join(targetDir, fileName);
      finalMimeType = mimeType;

      await fs.writeFile(filePath, fileBuffer);
    }

    const fileStats = await fs.stat(filePath);
    const relativePathFromBackend = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const publicUrl = `/${relativePathFromBackend}`;

    return {
      filename: fileName,
      path: filePath,
      url: publicUrl,
      size: fileStats.size,
      mimeType: finalMimeType
    };
  }
}

module.exports = UploadService;
