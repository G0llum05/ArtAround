const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../data/model/User');
const Artist = require('../data/model/Artist');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');
const NavigatorService = require('../service/NavigatorService');

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

// Styling ANSI Colors for Terminal Output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  gold: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  gray: "\x1b[90m"
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log(`\n${colors.gold}${colors.bright}=====================================================${colors.reset}`);
  console.log(`${colors.gold}${colors.bright}   🎨 ARTAROUND NAVIGATOR (Progetto 18-33 CLI) 🎨${colors.reset}`);
  console.log(`${colors.gold}${colors.bright}=====================================================${colors.reset}\n`);

  console.log(`${colors.gray}[CLI] Connessione a MongoDB (${MONGO_URI})...${colors.reset}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`${colors.green}[CLI] Connessione a MongoDB stabilita con successo.${colors.reset}\n`);

    // 1. Carica Musei disponibili
    const museums = await Museum.find({}).populate('visits').exec();
    if (!museums || museums.length === 0) {
      console.log(`${colors.red}[CLI] Errore: Nessun museo trovato nel DB. Esegui prima lo script "npm run seed".${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.bright}--- MUSEI DISPONIBILI ---${colors.reset}`);
    museums.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${colors.cyan}${m.name}${colors.reset} (${m.address?.city || 'Città'}) - Visite collegate: ${m.visits?.length || 0}`);
    });

    const museumChoiceStr = await askQuestion(`\n${colors.gold}Seleziona un museo (1-${museums.length}): ${colors.reset}`);
    const museumIdx = Math.max(0, Math.min(museums.length - 1, parseInt(museumChoiceStr) - 1 || 0));
    const selectedMuseum = museums[museumIdx];

    // 2. Seleziona Visita
    const { visit } = await NavigatorService.getVisitWithDetails(selectedMuseum.visits[0]?._id || selectedMuseum.visits[0]);
    if (!visit) {
      console.log(`${colors.red}[CLI] Nessuna visita valida associata a questo museo.${colors.reset}`);
      process.exit(1);
    }

    console.log(`\n${colors.green}✔ Visita Selezionata:${colors.reset} "${colors.bright}${visit.title}${colors.reset}" (${visit.artworks?.length || 0} opere)`);

    // 3. Avvio Simulatore Visita
    let currentArtworkIndex = 0;
    let activeTone = 'medium';

    // Mostra opera iniziale
    let result = await NavigatorService.handleUserCommand({
      inputText: 'Inizio visita',
      visitId: visit._id,
      currentArtworkIndex,
      currentTone: activeTone
    });

    printState(result, visit.artworks.length);

    // Ciclo interattivo di comandi vocali / testuali
    while (true) {
      console.log(`\n${colors.gray}--- COMANDI PROVA DISPONIBILI ---`);
      console.log(` • "Spiegamelo per bambini" / "Più semplice"`);
      console.log(` • "Voglio dettagli accademici" / "Più approfondito"`);
      console.log(` • "Dove sta la toilette?" / "Dove sta il bar?" / "Dov'è l'uscita?"`);
      console.log(` • "Prossimo" / "Indietro"`);
      console.log(` • "Chi è l'autore?"`);
      console.log(` • Digita 'q' per uscire.${colors.reset}`);

      const userInput = await askQuestion(`\n${colors.gold}${colors.bright}Comando visitatore > ${colors.reset}`);
      const trimmed = userInput.trim();

      if (trimmed.toLowerCase() === 'q' || trimmed.toLowerCase() === 'exit') {
        console.log(`\n${colors.cyan}Chiusura del Navigator CLI. Buona giornata!${colors.reset}\n`);
        break;
      }

      if (!trimmed) continue;

      result = await NavigatorService.handleUserCommand({
        inputText: trimmed,
        visitId: visit._id,
        currentArtworkIndex: result.currentArtworkIndex,
        currentTone: result.activeTone
      });

      printState(result, visit.artworks.length);
    }

  } catch (err) {
    console.error(`\n${colors.red}[CLI Error] ${err.message}${colors.reset}`, err);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

function printState(result, totalArtworks) {
  const { activeArtwork, item, nlpResult, actionMessage, logisticalDirections, currentArtworkIndex, activeTone } = result;

  console.log(`\n${colors.gold}=========================================================================${colors.reset}`);
  console.log(`${colors.bright}🖼️  OPERA ${currentArtworkIndex + 1}/${totalArtworks}: "${activeArtwork.title}"${colors.reset}`);
  console.log(`📍 Posizione: Stanza "${activeArtwork.location?.room || 'Galleria Principal'}", Piano: ${activeArtwork.location?.floor || 'Piano Terra'}`);
  console.log(`🏷️ QR Code: [${activeArtwork.qrCode || 'ART_QR'}]`);
  
  if (nlpResult && nlpResult.intent !== 'UNKNOWN') {
    console.log(`${colors.magenta}🤖 NLP Intent Riconosciuto: ${nlpResult.intent} (Confidence: ${nlpResult.confidence || 0.95})${colors.reset}`);
  }

  if (actionMessage) {
    console.log(`${colors.cyan}💬 Stato: ${actionMessage}${colors.reset}`);
  }

  console.log(`\n${colors.green}${colors.bright}🔊 CONTENUTO AUDIO/TESTO (Tono: ${activeTone.toUpperCase()}, Lingua: ${item.language || 'IT'}):${colors.reset}`);
  console.log(`${colors.bright}"${item.description}"${colors.reset}`);
  console.log(`${colors.gray}   (Fonte: ${item.fromCache ? 'Cache MongoDB (0ms)' : 'Generato dall\'AI Engine'} | Generato da AI: ${item.isAIGenerated} | Autore: ${item.authorName || 'Curatore'})${colors.reset}`);

  if (logisticalDirections) {
    console.log(`\n${colors.gold}${colors.bright}🧭 INDICAZIONI LOGISTICHE / NAVIGATORE:${colors.reset}`);
    console.log(`${colors.gold}"${logisticalDirections}"${colors.reset}`);
  }
  console.log(`${colors.gold}=========================================================================${colors.reset}`);
}

main();
