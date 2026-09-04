const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../data/model/User');
const Artist = require('../data/model/Artist');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');
const UploadService = require('../service/UploadService');
const Imager = require('../utils/Imager');

// Build connection URI flexibly for host / docker environments
function getMongoUri() {
  if (process.env.DB_URI) return process.env.DB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  const host = process.env.MONGO_HOST || '127.0.0.1';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DATABASE || 'site252623';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
  }
  return `mongodb://${host}:${port}/${db}`;
}

const MONGO_URI = getMongoUri();

// Load and aggregate data from all seed files in data/seed/ folder
async function loadAllSeedData() {
  const seedDir = path.join(__dirname, '../data/seed');
  const aggregated = {
    users: [],
    museums: [],
    artists: [],
    items: [],
    artworks: [],
    visits: []
  };

  if (!fs.existsSync(seedDir)) {
    console.error(`[Seed] Error: Seed directory not found at ${seedDir}`);
    return aggregated;
  }

  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));
  console.log(`[Seed] Loading ${files.length} seed file(s) from directory: backend/data/seed/`);

  for (const file of files) {
    const filePath = path.join(seedDir, file);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    if (data.users) aggregated.users.push(...data.users);
    if (data.artists) aggregated.artists.push(...data.artists);
    if (data.items) aggregated.items.push(...data.items);
    if (data.artworks) aggregated.artworks.push(...data.artworks);
    if (data.visits) aggregated.visits.push(...data.visits);

    if (Array.isArray(data.museums)) {
      aggregated.museums.push(...data.museums);
    } else if (data.museum) {
      aggregated.museums.push(data.museum);
    }
  }

  return aggregated;
}

/**
 * Processa e carica le immagini da assets/seed tramite UploadService
 */
async function uploadSeedAssets({ artistMap, museumMap, visitMap, artworkMap }) {
  console.log('\n[Seed Assets] Starting image upload and processing via UploadService...');

  const assetsMuseumsDir = path.join(__dirname, '../assets/museums');
  const assetsArtistsDir = path.join(__dirname, '../assets/artists');

  // Pulizia e preparazione directory operative
  await fsExtra.ensureDir(assetsMuseumsDir);
  await fsExtra.ensureDir(assetsArtistsDir);
  await fsExtra.emptyDir(assetsMuseumsDir);
  await fsExtra.emptyDir(assetsArtistsDir);

  // Caricamento Immagini Artisti (Decentralizzati)
  const seedArtistsDir = path.join(__dirname, '../assets/seed/artists');
  if (fs.existsSync(seedArtistsDir)) {
    console.log('[Seed Assets] Processing decentralized artist images...');
    const artistFolders = fs.readdirSync(seedArtistsDir);
    for (const artistKey of artistFolders) {
      const artistDirPath = path.join(seedArtistsDir, artistKey);
      if (!fs.statSync(artistDirPath).isDirectory()) continue;

      const artistId = artistMap[artistKey];
      if (!artistId) {
        console.warn(`[Seed Assets] Warning: Artist key "${artistKey}" not found in database mappings.`);
        continue;
      }

      const files = fs.readdirSync(artistDirPath).filter(file => Imager.isImage(file));
      for (const file of files) {
        const filePath = path.join(artistDirPath, file);
        const payload = {
          buffer: fs.readFileSync(filePath),
          originalname: file,
          mimetype: Imager.getMimeType(file)
        };
        try {
          const url = await UploadService.artistImgUpload(artistId.toString(), payload);
          console.log(`[Seed Assets] Loaded artist image for "${artistKey}" -> ${url}`);
        } catch (err) {
          console.error(`[Seed Assets] Error uploading artist image "${file}" for "${artistKey}":`, err.message);
        }
      }
    }
  }

  // Caricamento Immagini Musei, Visite e Opere d'Arte
  const seedMuseumsDir = path.join(__dirname, '../assets/seed/museums');
  if (fs.existsSync(seedMuseumsDir)) {
    console.log('[Seed Assets] Processing museum, visit, and artwork images...');
    const museumFolders = fs.readdirSync(seedMuseumsDir);
    for (const museumKey of museumFolders) {
      const museumDirPath = path.join(seedMuseumsDir, museumKey);
      if (!fs.statSync(museumDirPath).isDirectory()) continue;

      const museumId = museumMap[museumKey];
      if (!museumId) {
        console.warn(`[Seed Assets] Warning: Museum key "${museumKey}" not found in database mappings.`);
        continue;
      }

      // Meta / Cover Museo
      const metaDir = path.join(museumDirPath, 'meta');
      if (fs.existsSync(metaDir) && fs.statSync(metaDir).isDirectory()) {
        const metaFiles = fs.readdirSync(metaDir).filter(file => Imager.isImage(file));
        for (const file of metaFiles) {
          const filePath = path.join(metaDir, file);
          const payload = {
            buffer: fs.readFileSync(filePath),
            originalname: file,
            mimetype: Imager.getMimeType(file)
          };
          try {
            const url = await UploadService.museumImgUpload(museumId.toString(), payload);
            console.log(`[Seed Assets] Loaded museum cover for "${museumKey}" -> ${url}`);
          } catch (err) {
            console.error(`[Seed Assets] Error uploading museum cover "${file}" for "${museumKey}":`, err.message);
          }
        }
      }

      // Mappa Museo
      const mapDir = path.join(museumDirPath, 'map');
      if (fs.existsSync(mapDir) && fs.statSync(mapDir).isDirectory()) {
        const mapFiles = fs.readdirSync(mapDir).filter(file => Imager.isImage(file));
        for (const file of mapFiles) {
          const filePath = path.join(mapDir, file);
          const payload = {
            buffer: fs.readFileSync(filePath),
            originalname: file,
            mimetype: Imager.getMimeType(file)
          };
          try {
            const url = await UploadService.museumMapImgUpload(museumId.toString(), payload);
            console.log(`[Seed Assets] Loaded museum map for "${museumKey}" -> ${url}`);
          } catch (err) {
            console.error(`[Seed Assets] Error uploading museum map "${file}" for "${museumKey}":`, err.message);
          }
        }
      }

      // Visite
      const visitsDir = path.join(museumDirPath, 'visits');
      if (fs.existsSync(visitsDir) && fs.statSync(visitsDir).isDirectory()) {
        const visitFolders = fs.readdirSync(visitsDir);
        for (const visitKey of visitFolders) {
          const visitDirPath = path.join(visitsDir, visitKey);
          if (!fs.statSync(visitDirPath).isDirectory()) continue;

          const visitId = visitMap[visitKey];
          if (!visitId) {
            console.warn(`[Seed Assets] Warning: Visit key "${visitKey}" not found in database mappings.`);
            continue;
          }

          const visitFiles = fs.readdirSync(visitDirPath).filter(file => Imager.isImage(file));
          for (const file of visitFiles) {
            const filePath = path.join(visitDirPath, file);
            const payload = {
              buffer: fs.readFileSync(filePath),
              originalname: file,
              mimetype: Imager.getMimeType(file)
            };
            try {
              const url = await UploadService.visitImgUpload(museumId.toString(), visitId.toString(), payload);
              console.log(`[Seed Assets] Loaded visit image for "${visitKey}" in "${museumKey}" -> ${url}`);
            } catch (err) {
              console.error(`[Seed Assets] Error uploading visit image "${file}" for "${visitKey}":`, err.message);
            }
          }
        }
      }

      // Opere d'Arte
      const artworksDir = path.join(museumDirPath, 'artworks');
      if (fs.existsSync(artworksDir) && fs.statSync(artworksDir).isDirectory()) {
        const artworkFolders = fs.readdirSync(artworksDir);
        for (const artworkKey of artworkFolders) {
          const artworkDirPath = path.join(artworksDir, artworkKey);
          if (!fs.statSync(artworkDirPath).isDirectory()) continue;

          const artworkId = artworkMap[artworkKey];
          if (!artworkId) {
            console.warn(`[Seed Assets] Warning: Artwork key "${artworkKey}" not found in database mappings.`);
            continue;
          }

          const artworkFiles = fs.readdirSync(artworkDirPath).filter(file => Imager.isImage(file));
          for (const file of artworkFiles) {
            const filePath = path.join(artworkDirPath, file);
            const payload = {
              buffer: fs.readFileSync(filePath),
              originalname: file,
              mimetype: Imager.getMimeType(file)
            };
            try {
              const url = await UploadService.artworkImgUpload(museumId.toString(), artworkId.toString(), payload);
              console.log(`[Seed Assets] Loaded artwork image for "${artworkKey}" in "${museumKey}" -> ${url}`);
            } catch (err) {
              console.error(`[Seed Assets] Error uploading artwork image "${file}" for "${artworkKey}":`, err.message);
            }
          }
        }
      }
    }
  }

  console.log('[Seed Assets] All seed images processed and attached successfully.');
}

async function runSeed({ isStandalone = false } = {}) {
  let connectedLocally = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);

      const options = {};
      if (process.env.MONGO_USER) options.user = process.env.MONGO_USER;
      if (process.env.MONGO_PASSWORD) options.pass = process.env.MONGO_PASSWORD;

      await mongoose.connect(MONGO_URI, options);
      connectedLocally = true;
      console.log('[Seed] Database connection established successfully.');
    }

    const seedData = await loadAllSeedData();

    // Clear existing dataset
    console.log('[Seed] Cleaning old collection data...');
    await User.deleteMany({});
    await Item.deleteMany({});
    await Artist.deleteMany({});
    await Artwork.deleteMany({});
    await Visit.deleteMany({});
    await Museum.deleteMany({});

    // Mappings for keys to ObjectIds
    const userMap = {};
    const artistMap = {};
    const itemMap = {};
    const artworkMap = {};
    const visitMap = {};
    const museumMap = {};

    // Insert Users
    console.log('[Seed] Inserting users...');
    for (const userData of seedData.users) {
      if (userMap[userData.key]) continue;
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        userMap[userData.key] = existingUser._id;
        continue;
      }
      const hashedPassword = await bcrypt.hash(userData.password || 'Password123!', 10);
      const user = new User({
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'guest',
        roleStatus: userData.roleStatus || 'approved'
      });
      const savedUser = await user.save();
      userMap[userData.key] = savedUser._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(userMap).length} user(s).`);

    // Insert Artists
    console.log('[Seed] Inserting artists...');
    for (const artistData of seedData.artists) {
      if (artistMap[artistData.key]) continue;
      const rawImages = artistData.assets?.images || artistData.images || (artistData.profilePicture ? [artistData.profilePicture] : []) || [];
      const formattedImages = rawImages.map(img => {
        if (typeof img === 'string') return { url: img, orientation: 'portrait' };
        return { url: img.url || '', orientation: img.orientation || 'portrait' };
      });
      const artist = new Artist({
        name: artistData.name,
        surname: artistData.surname,
        artisticCurrents: artistData.artisticCurrents || [],
        artworks: [],
        assets: {
          images: formattedImages
        }
      });
      const savedArtist = await artist.save();
      artistMap[artistData.key] = savedArtist._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(artistMap).length} artist(s).`);

    // Insert Items
    console.log('[Seed] Inserting items...');
    const ALLOWED_LANGS = ['it', 'en', 'fr', 'es', 'de', 'cn', 'ru'];
    const ALLOWED_TONES = ['infantile', 'simple', 'medium', 'technical'];
    const ALLOWED_LENGTHS = [15, 30, 60];

    const sanitizeSeedLanguage = (lang) => {
      const clean = typeof lang === 'string' ? lang.toLowerCase().trim() : '';
      return ALLOWED_LANGS.includes(clean) ? clean : 'it';
    };

    const sanitizeSeedTone = (tone) => {
      if (!tone) return 'medium';
      const t = String(tone).toLowerCase().trim();
      if (ALLOWED_TONES.includes(t)) return t;
      if (t === 'scientific' || t === 'expert' || t === 'advanced' || t === 'technical') return 'technical';
      if (t === 'fun' || t === 'informal' || t === 'child' || t === 'infantile') return 'infantile';
      if (t === 'easy' || t === 'simple') return 'simple';
      return 'medium';
    };

    const sanitizeSeedLength = (length) => {
      const len = parseInt(length, 10);
      if (ALLOWED_LENGTHS.includes(len)) return len;
      if (!len || len > 45) return 60;
      if (len <= 20) return 15;
      return 30;
    };

    for (const itemData of seedData.items) {
      if (itemMap[itemData.key]) continue;
      const item = new Item({
        description: itemData.description,
        tone: sanitizeSeedTone(itemData.tone),
        length: sanitizeSeedLength(itemData.length),
        author: userMap[itemData.author] || null,
        authorName: itemData.authorName || 'Curatore',
        license: itemData.license || 'Standard',
        language: sanitizeSeedLanguage(itemData.language),
        isAIGenerated: itemData.isAIGenerated || false
      });
      const savedItem = await item.save();
      itemMap[itemData.key] = savedItem._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(itemMap).length} item(s).`);

    // Insert Artworks
    console.log('[Seed] Inserting artworks...');
    for (const artworkData of seedData.artworks) {
      if (artworkMap[artworkData.key]) continue;
      const artistIds = (artworkData.artists || []).map(k => artistMap[k]).filter(Boolean);
      const defaultItemIds = (artworkData.defaultItems || artworkData.items || []).map(k => itemMap[k]).filter(Boolean);

      const rawImages = artworkData.assets?.images || artworkData.images || [];
      const formattedImages = rawImages.map(img => typeof img === 'string' ? { url: img, orientation: 'landscape' } : img);

      const artwork = new Artwork({
        title: artworkData.title,
        startYear: artworkData.startYear,
        endYear: artworkData.endYear,
        artists: artistIds,
        location: artworkData.location,
        dimensions: artworkData.dimensions,
        artisticCurrents: artworkData.artisticCurrents || [],
        details: artworkData.details,
        isActive: artworkData.isActive ?? true,
        isPrivate: artworkData.isPrivate ?? false,
        qrCode: artworkData.qrCode,
        assets: {
          images: formattedImages
        },
        defaultItems: defaultItemIds
      });

      const savedArtwork = await artwork.save();
      artworkMap[artworkData.key] = savedArtwork._id;

      // Update artists' artwork arrays
      for (const artistId of artistIds) {
        await Artist.findByIdAndUpdate(artistId, { $push: { artworks: savedArtwork._id } });
      }

      // Update items' artwork field
      for (const itemId of defaultItemIds) {
        await Item.findByIdAndUpdate(itemId, { artwork: savedArtwork._id });
      }
    }
    console.log(`[Seed] Inserted ${Object.keys(artworkMap).length} artwork(s).`);

    // Insert Visits
    console.log('[Seed] Inserting visits...');
    for (const visitData of seedData.visits) {
      if (visitMap[visitData.key]) continue;
      const creatorId = userMap[visitData.creator];

      let visitEntries = [];
      const rawSteps = visitData.steps || visitData.visits || [];
      if (Array.isArray(rawSteps)) {
        visitEntries = rawSteps.map(v => {
          if (typeof v === 'string') {
            return { artwork: artworkMap[v], items: [], tellMeMore: null };
          }
          const artId = artworkMap[v.artwork] || v.artwork;
          const itmIds = (v.items || []).map(k => itemMap[k] || k).filter(Boolean);
          const tellMeMoreId = v.tellMeMore ? (itemMap[v.tellMeMore] || v.tellMeMore) : null;
          return { artwork: artId, items: itmIds, tellMeMore: tellMeMoreId };
        }).filter(v => Boolean(v.artwork));
      } else if (Array.isArray(visitData.artworks)) {
        visitEntries = visitData.artworks.map(k => ({
          artwork: artworkMap[k],
          items: [],
          tellMeMore: null
        })).filter(v => Boolean(v.artwork));
      }

      const rawVisitImages = visitData.assets?.images || visitData.images || [];
      const formattedVisitImages = rawVisitImages.map(img => {
        if (typeof img === 'string') return { url: img, orientation: 'landscape' };
        return { url: img.url || '', orientation: img.orientation || 'landscape' };
      });

      const visit = new Visit({
        title: visitData.title,
        description: visitData.description,
        price: visitData.price,
        license: visitData.license || 'Licenza Standard',
        creator: creatorId,
        steps: visitEntries,
        minDuration: visitData.minDuration,
        maxDuration: visitData.maxDuration,
        isActive: visitData.isActive ?? true,
        availability: visitData.availability,
        weeklySchedule: visitData.weeklySchedule,
        disableFriendly: visitData.disableFriendly ?? true,
        requirements: visitData.requirements,
        categories: visitData.categories || [],
        likesCount: visitData.likesCount ?? Math.floor(Math.random() * 150) + 20,
        views: visitData.views || { total: Math.floor(Math.random() * 500) + 100, weekly: Math.floor(Math.random() * 100) + 10 },
        isVerified: visitData.isVerified ?? true,
        assets: {
          images: formattedVisitImages
        }
      });

      const savedVisit = await visit.save();
      visitMap[visitData.key] = savedVisit._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(visitMap).length} visit(s).`);

    // 7. Insert Museums
    console.log('[Seed] Inserting museum(s)...');
    for (const museumData of seedData.museums) {
      const museumVisitIds = (museumData.visits || []).map(k => visitMap[k]).filter(Boolean);
      const museumArtworkIds = (museumData.artworks || []).map(k => artworkMap[k]).filter(Boolean);

      const museum = new Museum({
        name: museumData.name,
        description: museumData.description,
        address: museumData.address,
        contact: museumData.contact,
        maxCapacity: museumData.maxCapacity,
        actualCapacity: museumData.actualCapacity || 0,
        visits: museumVisitIds,
        artworks: museumArtworkIds,
        openingHours: museumData.openingHours,
        ticketInfo: museumData.ticketInfo,
        isActive: museumData.isActive ?? true,
        requirements: museumData.requirements,
        services: museumData.services || {
          hasToilette: true,
          hasDisabledToilette: true,
          hasElevator: true,
          hasStairs: true,
          hasBar: true,
          hasShop: true,
          hasAudioGuide: true,
          hasAirConditioning: true,
          hasWifi: true
        },
        accessibility: museumData.accessibility || {
          disableFriendly: true,
          wheelchairAccessible: true,
          childFriendly: true,
          petFriendly: false,
          tactilePaths: false,
          brailleSignage: false,
          audioDescriptions: true,
          notes: "Percorsi accessibili e ascensori disponibili."
        },
        pointsOfInterest: museumData.pointsOfInterest || [
          { name: "Toilette Principale", type: "toilette", floor: "Piano Terra", room: "Atrio Ingresso" },
          { name: "Uscita Principale", type: "exit", floor: "Piano Terra", room: "Atrio Uscita" },
          { name: "Ascensore Principale", type: "elevator", floor: "Piano Terra", room: "Atrio Ingresso" },
          { name: "Bar / Caffetteria", type: "bar", floor: "Piano Terra", room: "Cortile Interno" },
          { name: "Biglietteria", type: "ticket_office", floor: "Piano Terra", room: "Atrio Ingresso" },
          { name: "Info Point / Navigatore", type: "info_point", floor: "Piano Terra", room: "Atrio Ingresso" }
        ],
        floors: museumData.floors || [
          { level: 0, name: "Piano Terra", description: "Atrio, Biglietteria e Sale Principali" },
          { level: 1, name: "Primo Piano", description: "Esposizioni e Pinacoteca" }
        ],
        transportInfo: museumData.transportInfo || {
          publicTransport: "Linee bus urbane con fermata adiacente al museo",
          parkingDetails: "Parcheggio pubblico a 200m"
        },
        eventsAndExhibitions: museumData.eventsAndExhibitions || {
          specialEvents: ["Visite notturne guidate"],
          temporaryExhibitions: []
        }
      });

      const savedMuseum = await museum.save();
      museumMap[museumData.key] = savedMuseum._id;
      console.log(`[Seed] Successfully inserted museum: "${savedMuseum.name}" (${savedMuseum._id})`);
    }

    // 8. Process and Upload Seed Assets
    await uploadSeedAssets({ artistMap, museumMap, visitMap, artworkMap });

    console.log('[Seed] Complete! Database populated cleanly with all entities and assets.');
    return { success: true, message: 'Database populated cleanly with all entities and assets.' };
  } catch (err) {
    console.error('[Seed] Error populating database:', err);
    throw err;
  } finally {
    if (isStandalone && connectedLocally) {
      await mongoose.disconnect();
      console.log('[Seed] Disconnected from MongoDB.');
    }
  }
}

if (require.main === module) {
  runSeed({ isStandalone: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed CLI Error]:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
