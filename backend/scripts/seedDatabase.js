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

async function seed() {
  console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);

  const options = {};
  if (process.env.MONGO_USER) options.user = process.env.MONGO_USER;
  if (process.env.MONGO_PASSWORD) options.pass = process.env.MONGO_PASSWORD;

  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('[Seed] Database connection established successfully.');

    const seedFilePath = path.join(__dirname, '../data/seedData.json');
    const rawData = fs.readFileSync(seedFilePath, 'utf-8');
    const seedData = JSON.parse(rawData);

    // 1. Clear existing dataset
    console.log('[Seed] Cleaning old collection data...');
    await User.deleteMany({ email: { $in: seedData.users.map(u => u.email) } });
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
      const item = new Item({
        description: itemData.description,
        tone: itemData.tone,
        length: itemData.length
      });
      const savedItem = await item.save();
      itemMap[itemData.key] = savedItem._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(itemMap).length} item(s).`);

    // 5. Insert Artworks
    console.log('[Seed] Inserting artworks...');
    for (const artworkData of seedData.artworks) {
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
      const artworkIds = (visitData.artworks || []).map(k => artworkMap[k]).filter(Boolean);
      const creatorId = userMap[visitData.creator];

      const visit = new Visit({
        title: visitData.title,
        description: visitData.description,
        price: visitData.price,
        creator: creatorId,
        artworks: artworkIds,
        minDuration: visitData.minDuration,
        maxDuration: visitData.maxDuration,
        isActive: visitData.isActive ?? true,
        availability: visitData.availability,
        weeklySchedule: visitData.weeklySchedule,
        disableFriendly: visitData.disableFriendly ?? true,
        requirements: visitData.requirements
      });

      const savedVisit = await visit.save();
      visitMap[visitData.key] = savedVisit._id;
    }
    console.log(`[Seed] Inserted ${Object.keys(visitMap).length} visit(s).`);

    // 7. Insert Museum
    console.log('[Seed] Inserting museum...');
    const museumData = seedData.museum;
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
      requirements: museumData.requirements
    });

    const savedMuseum = await museum.save();
    console.log(`[Seed] Successfully inserted museum: "${savedMuseum.name}" (${savedMuseum._id})`);

    console.log('[Seed] Complete! Database populated cleanly.');
  } catch (err) {
    console.error('[Seed] Error populating database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

seed();
