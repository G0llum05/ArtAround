const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const Imager = require('../utils/Imager');
class UploadService {

  static getMuseumRelatedDir({ museumId, visitId, artworkId, artistId, isMeta }) {
    if (!museumId) {
      throw new Error('museumId è obbligatorio per definire il percorso di salvataggio.');
    }
    const baseMuseumDir = path.join(__dirname, '../assets/museums', museumId);


    // Le immagini dell'artwork risiedono in modo centralizzato sotto artworks/:artworkId
    // per permettere a un artwork di far parte di più visite senza duplicazione file
    if (artworkId) {
      return path.join(baseMuseumDir, 'artworks', artworkId);
    }
    
    if (artistId) {
      // assets/museums/:museumId/visit/:visitId/meta
      return path.join(baseMuseumDir, 'visit', artistId, 'meta');
    }

    if (visitId) {
      // assets/museums/:museumId/visit/:visitId/meta
      return path.join(baseMuseumDir, 'visit', visitId, 'meta');
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
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
        foundUrls.push(`/${relativePath}`);
      }
    } catch (err) {
      console.error(`[UploadService] Errore durante la scansione della cartella ${dirPath}:`, err);
    }
  }
  
  static async getArtworkImages({ museumId, artworkId }) {
    if (!artworkId || !museumId) return [];
    
    let artworkUrls = [];

    const targetDir = path.join(__dirname, '../assets/museums', museumId, 'artworks', artworkId);

    await this.scanDir(targetDir, artworkUrls);
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
  static getMuseumRelatedFilePrefix({ museumId, visitId, artworkId }) {
    if (artworkId) {
      return artworkId;
    }
    if (visitId) {
      return visitId;
    }
    return museumId;
  }


  static async processAndSaveImage(toSaveFileInfo = {}) {
    let fileName, filePath, finalMimeType;

    switch (toSaveFileInfo.tag) {
      case 'MUSEUM':
        if (Imager.isRaster(toSaveFileInfo.mimeType)) {
          fileName = `${toSaveFileInfo.prefix}_${toSaveFileInfo.nextIndex}.webp`;
          filePath = path.join(toSaveFileInfo.targetDir, fileName);
          finalMimeType = 'image/webp';      
          await sharp(toSaveFileInfo.fileBuffer)
            .webp({ quality: 82, effort: 4 })
            .toFile(filePath);
        } else {
          const ext = Imager.getExt(toSaveFileInfo.originalName);
          fileName = `${toSaveFileInfo.prefix}_${toSaveFileInfo.nextIndex}.${ext}`;
          filePath = path.join(toSaveFileInfo.targetDir, fileName);
          finalMimeType = toSaveFileInfo.mimeType;
    
          await fs.writeFile(filePath, toSaveFileInfo.fileBuffer);
        }
        break;
      case 'PROPIC':
        if (Imager.isRaster(toSaveFileInfo.mimeType)) {
          fileName = `${toSaveFileInfo.userId}.webp`;
          filePath = path.join(toSaveFileInfo.basePropicDir, fileName);
          finalMimeType = 'image/webp';
          
          await sharp(toSaveFileInfo.fileBuffer)
            .webp({ quality: 82, effort: 4 })
            .toFile(filePath);
        } else {
          const ext = Imager.getExt(toSaveFileInfo.originalName);
          fileName = `${toSaveFileInfo.userId}.${ext}`;
          filePath = path.join(toSaveFileInfo.basePropicDir, fileName);
          finalMimeType = toSaveFileInfo.mimeType;

          await fs.writeFile(filePath, toSaveFileInfo.fileBuffer);
        }
        break;
      default:
        console.error("Errore: tag errato!");
        return null;
    }

    return { fileName, filePath, finalMimeType }
  }
  /**
   * Process and save file buffer.
   * Transpiles image files to WebP format via Sharp.
   */
  static async saveMuseumRelatedImage(fileBuffer, originalName, mimeType, options = {}) {

    const targetDir = this.getMuseumRelatedDir(options);

    // 1. Ensure directory exists with fs-extra
    await fs.ensureDir(targetDir);
    const prefix = this.getMuseumRelatedFilePrefix(options);

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

    const tag = 'MUSEUM';
    
    let toSaveFileInfo = {
      prefix,
      nextIndex,
      targetDir,
      fileBuffer,
      originalName,
      tag
    }
    
    // if raster -> webp, if svg -> svg 
    const newFileInfo = await this.processAndSaveImage(toSaveFileInfo);

    const fileStats = await fs.stat(newFileInfo.filePath);
    const relativePathFromBackend = path.relative(path.join(__dirname, '..'), newFileInfo.filePath).replace(/\\/g, '/');
    const publicUrl = `/${relativePathFromBackend}`;

    return {
      filename: newFileInfo.fileName,
      path: newFileInfo.filePath,
      url: publicUrl,
      size: fileStats.size,
      mimeType: newFileInfo.finalMimeType
    };
  }

  /**
   * Salvataggio dell'immagine profilo dell'utente (propic).
   * Esegue i controlli opportuni su buffer, userId, mimeType.
   * Rimuove eventuali vecchie propic dell'utente per evitare file orfani.
   * Converte le immagini raster in formato WebP per ottimizzazione delle prestazioni.
   */
  static async savePropicImage(fileBuffer, originalName, mimeType, options = {}) {
    const userId = options.userId;

    const basePropicDir = path.join(__dirname, '../assets/users', userId, 'propic');
    await fs.ensureDir(basePropicDir);

    // Removes old propics
    try {
      const existingFiles = await fs.readdir(basePropicDir);
      for (const file of existingFiles) {
        await fs.remove(path.join(basePropicDir, file));
      }
    } catch (err) {
      console.warn(`[UploadService] Avviso durante la pulizia della vecchia propic per l'utente ${userId}:`, err.message);
    }

    const tag = 'PROPIC';
    let toSaveFileInfo = {
      userId,
      basePropicDir,
      fileBuffer,
      originalName,
      tag
    }

    const newFileInfo = await this.processAndSaveImage(toSaveFileInfo);

    // 5. Costruzione della risposta con i metadati e la public URL
    const fileStats = await fs.stat(newFileInfo.filePath);
    const relativePathFromBackend = path.relative(path.join(__dirname, '..'), newFileInfo.filePath).replace(/\\/g, '/');
    const publicUrl = `/${relativePathFromBackend}`;

    return {
      filename: newFileInfo.fileName,
      path: newFileInfo.filePath,
      url: publicUrl,
      size: fileStats.size,
      mimeType: newFileInfo.finalMimeType
    };
  }
}

module.exports = UploadService;
