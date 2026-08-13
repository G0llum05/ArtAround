const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const Imager = require('../utils/Imager');
const Museum = require('../data/model/Museum');
const Visit = require('../data/model/Visit');
const Artwork = require('../data/model/Artwork');
const Artist = require('../data/model/Artist');
const User = require('../data/model/User');

class UploadService {

  static async museumImgUpload(museumId, file, orientation) {
    if (!museumId || !file) {
      throw new Error('museumId e file sono obbligatori per il caricamento dell\'immagine del museo.');
    }
  }

  static async visitImgUpload(museumId, visitId, file, orientation) {
    const targetOrientation = orientation || 'landscape';
    if (!museumId || !visitId || !file) {
      throw new Error('museumId, visitId e file sono obbligatori per il caricamento dell\'immagine della visita.');
    }

    // Controllo se la visita appartiene al museo
    if (!await Museum.exists({ _id: museumId, visits: visitId })) {
      throw new Error('Museo non trovato o la visita non appartiene a questo museo.');
    }

    const targetDir = path.join(__dirname, '../assets/museums', museumId, 'visit', visitId, 'meta');
    const fileName = `visit_${targetOrientation}.webp`;
    const fullPath = path.join(targetDir, fileName);

    // crea dir se non esiste
    await fs.ensureDir(targetDir);

    await this.saveImage(file.buffer, fullPath, file.mimetype);

    const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
    const publicUrl = `/${relativePath}`; // Risultato: /assets/museums/.../visit_landscape.webp

    const updatedVisit = await Visit.findByIdAndUpdate(visitId,
      {
        $push: { 'assets.images': { url: publicUrl, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedVisit) throw new Error('Visita non trovata.');

    return publicUrl;
  }

  static async saveImage(fileBuffer, fullPath, mimeType) {
    if (Imager.isRaster(mimeType)) {
      await sharp(fileBuffer)
        .webp({ quality: 82, effort: 4 })
        .toFile(fullPath);
    } else {
      await fs.writeFile(fullPath, fileBuffer);
    }
  }



  // TODO CHECK REFACTOR FINO A QUA

  static getMuseumRelatedDir({ museumId, visitId, artworkId, artistId, isMeta }) {
    if (!museumId) {
      throw new Error('museumId è obbligatorio per definire il percorso di salvataggio.');
    }
    const baseMuseumDir = path.join(__dirname, '../assets/museums', museumId);


    // Le immagini dell'artwork risiedono in modo centralizzato sotto artworks/:artworkId
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


  /**
   * Determina il suffisso per i file meta ('landscape' o 'portrait').
   * Può essere passato in options.orientation / options.suffix, o dedotto da nome/dimensioni sharp.
   */
  static async resolveMetaSuffix(fileBuffer, originalName, options = {}) {


    if (options.orientation === 'landscape' || options.orientation === 'portrait') {
      return options.orientation;
    }

    try {
      const metadata = await sharp(fileBuffer).metadata();
      if (metadata && metadata.width && metadata.height) {
        return metadata.width >= metadata.height ? 'landscape' : 'portrait';
      }
    } catch (err) {
      console.warn('[UploadService] Impossibile rilevare le dimensioni Sharp, fallback a landscape:', err.message);
    }

    return 'landscape';
  }


  static async processAndSaveImage(toSaveFileInfo = {}) {
    let fileName, filePath, finalMimeType;

    switch (toSaveFileInfo.tag) {
      case 'MUSEUM':
        if (Imager.isRaster(toSaveFileInfo.mimeType)) {
          fileName = `${toSaveFileInfo.prefix}_${toSaveFileInfo.suffix}.webp`;
          filePath = path.join(toSaveFileInfo.targetDir, fileName);
          finalMimeType = 'image/webp';
          await sharp(toSaveFileInfo.fileBuffer)
            .webp({ quality: 82, effort: 4 })
            .toFile(filePath);
        } else {
          const ext = Imager.getExt(toSaveFileInfo.originalName);
          fileName = `${toSaveFileInfo.prefix}_${toSaveFileInfo.suffix}.${ext}`;
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

    return { fileName, filePath, finalMimeType };
  }

  /**
   * Process and save file buffer.
   * Per le cartelle 'meta' (isMeta = true) i suffissi sono unicamente 'landscape' o 'portrait' (al massimo 2 file).
   * Per le altre cartelle si usano indici numerici sequenziali.
   */
  static async saveMuseumRelatedImage(fileBuffer, originalName, mimeType, options = {}) {
    const targetDir = this.getMuseumRelatedDir(options);

    // 1. Assicura l'esistenza della directory di destinazione
    await fs.ensureDir(targetDir);
    const prefix = this.getMuseumRelatedFilePrefix(options);
    const existingFiles = await fs.readdir(targetDir);
    const escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // definire in maniera migliore
    const isMeta = options.isMeta || targetDir.endsWith('/meta') || targetDir.endsWith('\\meta');
    let suffix;

    if (isMeta) {
      // Per i meta esistono solo 2 possibili suffissi: 'landscape' e 'portrait'
      suffix = await this.resolveMetaSuffix(fileBuffer, originalName, options);
    } else {
      // Per risorse non-meta (es. artworks, artists), si usa l'indice numerico sequenziale
      const prefixPattern = new RegExp(`^${escapedPrefix}_(\\d+)\\.`, 'i');
      let maxIndex = 0;
      for (const file of existingFiles) {
        const match = file.match(prefixPattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIndex) {
            maxIndex = num;
          }
        }
      }
      suffix = maxIndex + 1;
    }

    const tag = 'MUSEUM';

    let toSaveFileInfo = {
      prefix,
      suffix,
      targetDir,
      fileBuffer,
      originalName,
      mimeType,
      tag
    };

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
