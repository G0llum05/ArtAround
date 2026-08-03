const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../data/model/User');
const Artist = require('../data/model/Artist');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');

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
function loadAllSeedData() {
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

async function seed() {
  console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);

  const options = {};
  if (process.env.MONGO_USER) options.user = process.env.MONGO_USER;
  if (process.env.MONGO_PASSWORD) options.pass = process.env.MONGO_PASSWORD;

  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('[Seed] Database connection established successfully.');

    const seedData = loadAllSeedData();

    // 1. Clear existing dataset
    console.log('[Seed] Cleaning old collection data...');
    if (seedData.users.length > 0) {
      await User.deleteMany({ email: { $in: seedData.users.map(u => u.email) } });
    }
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

    // 2. Insert Users
    console.log('[Seed] Inserting users...');
    for (const userData of seedData.users) {
      if (userMap[userData.key]) continue; // avoid duplicates if key re-used
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        roleStatus: userData.roleStatus || 'approved'
      });
      const savedUser = await user.save();
      userMap[userData.key] = savedUser._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(userMap).length} user(s).`);

    // 3. Insert Artists
    console.log('[Seed] Inserting artists...');
    for (const artistData of seedData.artists) {
      if (artistMap[artistData.key]) continue;
      const artist = new Artist({
        name: artistData.name,
        surname: artistData.surname,
        artisticCurrents: artistData.artisticCurrents || [],
        artworks: []
      });
      const savedArtist = await artist.save();
      artistMap[artistData.key] = savedArtist._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(artistMap).length} artist(s).`);

    // 4. Insert Items
    console.log('[Seed] Inserting items...');
    for (const itemData of seedData.items) {
      if (itemMap[itemData.key]) continue;
      const item = new Item({
        description: itemData.description,
        tone: itemData.tone,
        length: itemData.length,
        author: userMap[itemData.author] || null,
        authorName: itemData.authorName || 'Curatore',
        license: itemData.license || 'Standard',
        language: itemData.language || 'it',
        isAIGenerated: itemData.isAIGenerated || false
      });
      const savedItem = await item.save();
      itemMap[itemData.key] = savedItem._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(itemMap).length} item(s).`);

    // 5. Insert Artworks
    console.log('[Seed] Inserting artworks...');
    for (const artworkData of seedData.artworks) {
      if (artworkMap[artworkData.key]) continue;
      const artistIds = (artworkData.artists || []).map(k => artistMap[k]).filter(Boolean);
      const itemIds = (artworkData.items || []).map(k => itemMap[k]).filter(Boolean);

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
        images: artworkData.images || [],
        items: itemIds
      });

      const savedArtwork = await artwork.save();
      artworkMap[artworkData.key] = savedArtwork._id;

      // Update artists' artwork arrays
      for (const artistId of artistIds) {
        await Artist.findByIdAndUpdate(artistId, { $push: { artworks: savedArtwork._id } });
      }
    }
    console.log(`[Seed] Inserted ${Object.keys(artworkMap).length} artwork(s).`);

    // 6. Insert Visits
    console.log('[Seed] Inserting visits...');
    for (const visitData of seedData.visits) {
      if (visitMap[visitData.key]) continue;
      const artworkIds = (visitData.artworks || []).map(k => artworkMap[k]).filter(Boolean);
      const creatorId = userMap[visitData.creator];

      const visit = new Visit({
        title: visitData.title,
        description: visitData.description,
        price: visitData.price,
        license: visitData.license || 'Licenza Standard',
        creator: creatorId,
        artworks: artworkIds,
        minDuration: visitData.minDuration,
        maxDuration: visitData.maxDuration,
        isActive: visitData.isActive ?? true,
        availability: visitData.availability,
        weeklySchedule: visitData.weeklySchedule,
        disableFriendly: visitData.disableFriendly ?? true,
        requirements: visitData.requirements,
        categories: visitData.categories || [],
        likesCount: visitData.likesCount ?? Math.floor(Math.random() * 150) + 20,
        views: visitData.views || { total: Math.floor(Math.random() * 500) + 100, weekly: Math.floor(Math.random() * 100) + 10 }
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
        disableFriendly: museumData.disableFriendly ?? true,
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
          audioDescriptions: true
        },
        pointsOfInterest: museumData.pointsOfInterest || [
          { name: "Toilette Principale", type: "toilette", floor: "Piano Terra", room: "Atrio Ingresso" },
          { name: "Uscita di Emergenza Nord", type: "emergency_exit", floor: "Piano Terra", room: "Sala 1" },
          { name: "Ascensore Principale", type: "elevator", floor: "Piano Terra", room: "Atrio Ingresso" },
          { name: "Bar / Caffetteria", type: "bar", floor: "Piano Terra", room: "Cortile Interno" },
          { name: "Bookshop", type: "shop", floor: "Piano Terra", room: "Atrio Ingresso" }
        ],
        floors: museumData.floors || [
          { level: 0, name: "Piano Terra", description: "Atrio e Sale Principali" },
          { level: 1, name: "Primo Piano", description: "Esposizioni e Pinacoteca" }
        ]
      });

      const savedMuseum = await museum.save();
      console.log(`[Seed] Successfully inserted museum: "${savedMuseum.name}" (${savedMuseum._id})`);
    }

    console.log('[Seed] Complete! Database populated cleanly from all seed files.');
  } catch (err) {
    console.error('[Seed] Error populating database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

seed();
