const fs = require('fs');
const path = require('path');

const seedDir = path.join(__dirname, '../data/seed');
const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

console.log(`Processing ${files.length} seed files in ${seedDir}...`);

for (const file of files) {
  const filePath = path.join(seedDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // 1. Migrate artworks: items -> defaultItems
  if (Array.isArray(data.artworks)) {
    data.artworks = data.artworks.map(art => {
      const { items, ...rest } = art;
      return {
        ...rest,
        defaultItems: items || art.defaultItems || []
      };
    });
  }

  // 2. Migrate visits: artworks -> visits: [{ artwork: "...", items: [] }]
  if (Array.isArray(data.visits)) {
    data.visits = data.visits.map(vis => {
      const { artworks, ...rest } = vis;
      let newVisits = [];
      if (Array.isArray(vis.visits)) {
        newVisits = vis.visits;
      } else if (Array.isArray(artworks)) {
        newVisits = artworks.map(artKey => ({
          artwork: artKey,
          items: []
        }));
      }
      return {
        ...rest,
        visits: newVisits
      };
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${file}`);
}

console.log('All seed files migrated successfully!');
