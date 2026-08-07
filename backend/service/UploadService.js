const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

class UploadService {
  /**
   * Resolves target filesystem directory based on parameters:
   * - assets/museums/:museumId/meta
   * - assets/museums/:museumId/visit/:visitId/meta
   * - assets/museums/:museumId/visit/:visitId/:artworkId
   * - assets/museums/:museumId/:artworkId
   */
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
   * - assets/museums/:museumId/artworks/:artworkId
   * - assets/museums/:museumId/:artworkId (fallback)
   */
  static async getArtworkImages({ museumId, artworkId }) {
    if (!artworkId) return [];

    const baseAssetsDir = path.join(__dirname, '../assets/museums');
    const imageExtensions = /\.(webp|jpg|jpeg|png|gif|bmp|tiff|svg)$/i;
    const foundUrls = [];

    const scanDirectory = async (dirPath) => {
      if (!(await fs.pathExists(dirPath))) return;
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (imageExtensions.test(file)) {
            const fullPath = path.join(dirPath, file);
            const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
            foundUrls.push(`/${relativePath}`);
          }
        }
      } catch (err) {
        console.error(`[UploadService] Errore durante la scansione della cartella ${dirPath}:`, err);
      }
    };

    if (museumId) {
      // 1. Scansiona cartella centralizzata assets/museums/:museumId/artworks/:artworkId
      await scanDirectory(path.join(baseAssetsDir, museumId, 'artworks', artworkId));
    } else {
      // Se museumId non è fornito, scansiona tutti i musei (caso di visite multi museali)
      if (await fs.pathExists(baseAssetsDir)) {
        const museums = await fs.readdir(baseAssetsDir);
        for (const musId of museums) {
          await scanDirectory(path.join(baseAssetsDir, musId, 'artworks', artworkId));
        }
      }
    }

    return Array.from(new Set(foundUrls));
  }

  static async getArtistImages({ museumId, artistId }) {
    if (!artistId) return [];

    const baseAssetsDir = path.join(__dirname, '../assets/museums');
    const imageExtensions = /\.(webp|jpg|jpeg|png|gif|bmp|tiff|svg)$/i;
    const foundUrls = [];

    const scanDirectory = async (dirPath) => {
      if (!(await fs.pathExists(dirPath))) return;
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (imageExtensions.test(file)) {
            const fullPath = path.join(dirPath, file);
            const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
            foundUrls.push(`/${relativePath}`);
          }
        }
      } catch (err) {
        console.error(`[UploadService] Errore durante la scansione della cartella ${dirPath}:`, err);
      }
    };

    if (museumId) {
      // 1. Scansiona cartella centralizzata assets/museums/:museumId/artworks/:artworkId
      await scanDirectory(path.join(baseAssetsDir, museumId, 'artisits', artistId));
    } else {
      // Se museumId non è fornito, scansiona tutti i musei (caso di visite multi museali)
      if (await fs.pathExists(baseAssetsDir)) {
        const museums = await fs.readdir(baseAssetsDir);
        for (const musId of museums) {
          await scanDirectory(path.join(baseAssetsDir, musId, 'artists', artistId));
        }
      }
    }

    return Array.from(new Set(foundUrls));
  }

  /**
   * Resolves base prefix for filename:
   * - artworkId -> artworkId
   * - visitId -> visitId
   * - museumId -> museumId
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
    const nextIndex = maxIndex + 1;

    const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg)$/i.test(originalName);

    let fileName;
    let filePath;
    let finalMimeType;

    if (isImage && (!mimeType || !mimeType.includes('svg'))) {
      // Transpile to WebP via Sharp
      fileName = `${prefix}_${nextIndex}.webp`;
      filePath = path.join(targetDir, fileName);
      finalMimeType = 'image/webp';

      await sharp(fileBuffer)
        .webp({ quality: 82, effort: 4 })
        .toFile(filePath);
    } else {
      // Write directly with fs-extra
      const ext = path.extname(originalName) || '';
      fileName = `${prefix}_${nextIndex}${ext}`;
      filePath = path.join(targetDir, fileName);
      finalMimeType = mimeType || 'application/octet-stream';

      await fs.writeFile(filePath, fileBuffer);
    }

    const fileStats = await fs.stat(filePath);
    const relativePathFromBackend = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const publicUrl = `/${relativePathFromBackend}`;

    return {
      filename: fileName,
      originalName: originalName,
      path: filePath,
      url: publicUrl,
      size: fileStats.size,
      mimeType: finalMimeType
    };
  }
}

module.exports = UploadService;
