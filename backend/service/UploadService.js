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
  // =========================================================================
  // HANDLER API DEDICATI PER RISORSA
  // =========================================================================

  /**
   * Caricamento immagine copertina/meta del museo
   */
  static async museumImgUpload(museumId, file, orientation) {
    if (!museumId || !file) {
      throw new Error('museumId e file sono obbligatori per il caricamento dell\'immagine del museo.');
    }

    if (!await Museum.exists({ _id: museumId })) {
      throw new Error('Museo non trovato.');
    }

    const savedFile = await this.saveMuseumRelatedImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { museumId, isMeta: true, orientation }
    );

    const targetOrientation = orientation || await this.resolveMetaSuffix(file.buffer, file.originalname, { orientation });

    const updatedMuseum = await Museum.findByIdAndUpdate(museumId,
      {
        $push: { 'assets.images': { url: savedFile.url, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedMuseum) throw new Error('Errore durante l\'aggiornamento del museo.');

    return savedFile.url;
  }
  
  /**
   * Caricamento immagine mappa del museo
   */
  static async museumMapImgUpload(museumId, file, orientation) {
    if (!museumId || !file) {
      throw new Error('museumId e file sono obbligatori per il caricamento dell\'immagine della mappa del museo.');
    }

    if (!await Museum.exists({ _id: museumId })) {
      throw new Error('Museo non trovato.');
    }

    const savedFile = await this.saveMuseumRelatedImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { museumId, isMap: true, orientation }
    );

    const targetOrientation = orientation || await this.resolveMetaSuffix(file.buffer, file.originalname, { orientation });

    const updatedMuseum = await Museum.findByIdAndUpdate(museumId,
      {
        $set: { 'assets.map': { url: savedFile.url, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedMuseum) throw new Error('Errore durante l\'aggiornamento del museo.');

    return savedFile.url;
  }

  /**
   * Caricamento immagine copertina/meta della visita
   */
  static async visitImgUpload(museumIdInput, visitId, file, orientation) {
    if (!visitId || !file) {
      throw new Error('visitId e file sono obbligatori per il caricamento dell\'immagine della visita.');
    }

    let museumId = museumIdInput;
    if (!museumId) {
      const museum = await Museum.findOne({ visits: visitId });
      if (museum) museumId = museum._id.toString();
    }

    if (!museumId) {
      throw new Error('museumId non fornito e nessun museo associato a questa visita.');
    }

    if (!await Museum.exists({ _id: museumId, visits: visitId })) {
      throw new Error('Museo non trovato o la visita non appartiene a questo museo.');
    }

    const savedFile = await this.saveMuseumRelatedImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { museumId, visitId, isMeta: true, orientation }
    );

    const targetOrientation = orientation || await this.resolveMetaSuffix(file.buffer, file.originalname, { orientation });

    const updatedVisit = await Visit.findByIdAndUpdate(visitId,
      {
        $push: { 'assets.images': { url: savedFile.url, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedVisit) throw new Error('Visita non trovata.');

    return savedFile.url;
  }

  /**
   * Caricamento immagine dell'opera d'arte
   */
  static async artworkImgUpload(museumIdInput, artworkId, file, orientation) {
    if (!artworkId || !file) {
      throw new Error('artworkId e file sono obbligatori per il caricamento dell\'immagine dell\'opera.');
    }

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      throw new Error('Opera non trovata.');
    }

    let museumId = museumIdInput;
    if (!museumId) {
      const museum = await Museum.findOne({ artworks: artworkId });
      if (museum) museumId = museum._id.toString();
    }

    if (!museumId) {
      throw new Error('museumId non fornito e nessun museo associato a questa opera.');
    }

    const savedFile = await this.saveMuseumRelatedImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { museumId, artworkId, orientation }
    );

    const targetOrientation = orientation || await this.resolveMetaSuffix(file.buffer, file.originalname, { orientation });

    const updatedArtwork = await Artwork.findByIdAndUpdate(artworkId,
      {
        $push: { 'assets.images': { url: savedFile.url, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedArtwork) throw new Error('Opera non trovata.');

    return savedFile.url;
  }

  /**
   * Caricamento immagine dell'artista (decentralizzata, senza dipendenza da museumId)
   */
  static async artistImgUpload(artistId, file, orientation) {
    if (!artistId || !file) {
      throw new Error('artistId e file sono obbligatori per il caricamento dell\'immagine dell\'artista.');
    }

    const artist = await Artist.findById(artistId);
    if (!artist) {
      throw new Error('Artista non trovato.');
    }

    const savedFile = await this.saveArtistImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { artistId, orientation }
    );

    const targetOrientation = orientation || await this.resolveMetaSuffix(file.buffer, file.originalname, { orientation }) || 'portrait';

    const updatedArtist = await Artist.findByIdAndUpdate(artistId,
      {
        $push: { 'assets.images': { url: savedFile.url, orientation: targetOrientation } }
      }, { new: true });

    if (!updatedArtist) throw new Error('Artista non trovato.');

    return savedFile.url;
  }

  /**
   * Caricamento foto profilo dell'utente (propic)
   */
  static async userPropicUpload(userId, file, orientation) {
    if (!userId || !file) {
      throw new Error('userId e file sono obbligatori per il caricamento della foto profilo.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato.');
    }

    const savedFile = await this.savePropicImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      { userId }
    );

    const targetOrientation = orientation || 'square';

    const updatedUser = await User.findByIdAndUpdate(userId,
      {
        'assets.profilePicture': { url: savedFile.url, orientation: targetOrientation }
      }, { new: true });

    if (!updatedUser) throw new Error('Utente non trovato.');

    return savedFile.url;
  }

  /**
   * Alias per userPropicUpload
   */
  static async handlePropicUpload(userId, file, orientation) {
    return this.userPropicUpload(userId, file, orientation);
  }

  // =========================================================================
  // SISTEMA DI PROCESSAMENTO E SALVATAGGIO IMMAGINI
  // =========================================================================

  /**
   * Processamento e scrittura del file su disco (conversione raster in WebP o salvataggio vettoriale)
   */
  static async processAndSaveImage(toSaveFileInfo = {}) {
    let fileName, filePath, finalMimeType;

    switch (toSaveFileInfo.tag) {
      case 'MUSEUM':
      case 'ARTIST':
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
        console.error('Errore: tag non valido in processAndSaveImage!');
        return null;
    }

    return { fileName, filePath, finalMimeType };
  }

  /**
   * Salvataggio immagini correlate a un museo (meta museo, meta visita, opere d'arte)
   */
  static async saveMuseumRelatedImage(fileBuffer, originalName, mimeType, options = {}) {
    const targetDir = this.getMuseumRelatedDir(options);

    await fs.ensureDir(targetDir);
    const prefix = this.getMuseumRelatedFilePrefix(options);
    const existingFiles = await fs.readdir(targetDir);
    const escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const isMeta = options.isMeta || targetDir.endsWith('/meta') || targetDir.endsWith('\\meta');
    const isMap = options.isMap || targetDir.endsWith('/map') || targetDir.endsWith('\\map');
    let suffix;

    if (isMeta || isMap) {
      if (isMap) {
        await fs.emptyDir(targetDir);
      }
      // Per meta e mappe si risolve l'orientamento: 'landscape', 'portrait', 'square'
      suffix = await this.resolveMetaSuffix(fileBuffer, originalName, options);
    } else {
      // Per risorse non-meta (es. artworks), si usa l'indice numerico sequenziale
      const prefixPattern = new RegExp(`^${escapedPrefix}_(\\d+)\\.`, 'i');
      let maxIndex = 0;
      for (const file of existingFiles) {
        const match = file.match(prefixPattern);
        if (match) {
          const num = parseInt(match[1], 10); // trasforma l'indice in un numero in base 10
          if (num > maxIndex) {
            maxIndex = num;
          }
        }
      }
      suffix = maxIndex + 1;
    }

    const tag = 'MUSEUM';

    const toSaveFileInfo = {
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
   * Salvataggio immagini decentralizzate dell'artista
   */
  static async saveArtistImage(fileBuffer, originalName, mimeType, options = {}) {
    const artistId = options.artistId;
    const targetDir = this.getArtistDir(artistId);

    await fs.ensureDir(targetDir);
    const prefix = artistId;
    const existingFiles = await fs.readdir(targetDir);
    const escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

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
    const suffix = maxIndex + 1;
    const tag = 'ARTIST';

    const toSaveFileInfo = {
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
   * Salvataggio dell'immagine profilo dell'utente (propic)
   */
  static async savePropicImage(fileBuffer, originalName, mimeType, options = {}) {
    const userId = options.userId;

    const basePropicDir = path.join(__dirname, '../assets/users', userId, 'propic');
    await fs.ensureDir(basePropicDir);

    // Pulizia vecchie propic per evitare file orfani
    try {
      const existingFiles = await fs.readdir(basePropicDir);
      for (const file of existingFiles) {
        await fs.remove(path.join(basePropicDir, file));
      }
    } catch (err) {
      console.warn(`[UploadService] Avviso durante la pulizia della vecchia propic per l'utente ${userId}:`, err.message);
    }

    const tag = 'PROPIC';

    const toSaveFileInfo = {
      userId,
      basePropicDir,
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

  // =========================================================================
  // HELPER & UTILITIES DI SUPPORTO
  // =========================================================================

  /**
   * Restituisce la directory di destinazione per le risorse collegate al museo
   */
  static getMuseumRelatedDir({ museumId, visitId, artworkId, isMap }) {
    if (!museumId) {
      throw new Error('museumId è obbligatorio per definire il percorso di salvataggio.');
    }
    const baseMuseumDir = path.join(__dirname, '../assets/museums', museumId);

    if (artworkId) {
      return path.join(baseMuseumDir, 'artworks', artworkId);
    }

    if (visitId) {
      return path.join(baseMuseumDir, 'visit', visitId, 'meta');
    }

    if (isMap) {
      return path.join(baseMuseumDir, 'map');
    }

    return path.join(baseMuseumDir, 'meta');
  }

  static getMapDir({ museumId }) {
    return this.getMuseumRelatedDir({ museumId, isMap: true });
  }

  /**
   * Restituisce la directory di destinazione per gli artisti (decentralizzata)
   */
  static getArtistDir(artistId) {
    if (!artistId) {
      throw new Error('artistId è obbligatorio per definire il percorso di salvataggio dell\'artista.');
    }
    return path.join(__dirname, '../assets/artists', artistId);
  }

  /**
   * Risolve il prefisso base per il nome del file
   */
  static getMuseumRelatedFilePrefix({ museumId, visitId, artworkId, isMap }) {
    if (artworkId) return artworkId;
    if (visitId) return visitId;
    if (isMap) return `${museumId}_map`;
    return museumId;
  }

  /**
   * Determina l'orientamento/suffisso per i file meta ('landscape' o 'portrait')
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

  /**
   * Scansione dei file presenti in una cartella
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

  /**
   * Recupera gli URL delle immagini per un'opera d'arte da filesystem
   */
  static async getArtworkImages({ museumId, artworkId }) {
    if (!artworkId || !museumId) return [];

    const artworkUrls = [];
    const targetDir = path.join(__dirname, '../assets/museums', museumId, 'artworks', artworkId);

    await this.scanDir(targetDir, artworkUrls);
    return Array.from(new Set(artworkUrls));
  }

  /**
   * Recupera gli URL delle immagini per un artista da filesystem
   */
  static async getArtistImages({ artistId, museumId }) {
    if (!artistId) return [];

    const artistUrls = [];
    const targetDir = path.join(__dirname, '../assets/artists', artistId);
    await this.scanDir(targetDir, artistUrls);

    if (museumId) {
      const legacyTargetDir = path.join(__dirname, '../assets/museums', museumId, 'artists', artistId);
      await this.scanDir(legacyTargetDir, artistUrls);
    }

    return Array.from(new Set(artistUrls));
  }

  static async getDefaultPropicUrl() {
    return null;
  }

  /**
   * Recupera l'URL della foto profilo di un utente, con fallback a null se non presente
   */
  static async getUserPropic(userId) {
    if (!userId) {
      return null;
    }

    try {
      const user = await User.findById(userId);
      if (user?.assets?.profilePicture?.url && !user.assets.profilePicture.url.includes('default.jpeg')) {
        return user.assets.profilePicture.url;
      }

      const basePropicDir = path.join(__dirname, '../assets/users', userId.toString(), 'propic');
      if (await fs.pathExists(basePropicDir)) {
        const files = await fs.readdir(basePropicDir);
        const imgFile = files.find(file => Imager.isImage(file));
        if (imgFile) {
          const fullPath = path.join(basePropicDir, imgFile);
          const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
          return `/${relativePath}`;
        }
      }
    } catch (err) {
      console.warn(`[UploadService] Errore durante il recupero propic per userId ${userId}:`, err.message);
    }

    return null;
  }
}

module.exports = UploadService;
