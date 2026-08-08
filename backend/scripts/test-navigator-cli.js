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
const Sanitizer = require('../utils/Sanitizer');

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
  console.log(`${colors.gold}${colors.bright}   🎨 ARTAROUND NAVIGATOR - ITEM ACTION CLI TEST 🎨${colors.reset}`);
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

    // 3. Stato iniziale del Visitatore
    let currentArtworkIndex = 0;
    let activeTone = Sanitizer.sanitizeTone('medium') || 'medium';
    let activeLanguage = Sanitizer.sanitizeLanguage('it') || 'it';
    let activeLength = Sanitizer.sanitizeLength(30) || 30;

    // Carica opera iniziale
    const initialItemRes = await NavigatorService.itemActionHandler(
      'EXPLAIN_ITEM',
      visit._id,
      currentArtworkIndex,
      activeTone,
      activeLength,
      activeLanguage
    );

    await printState({
      itemRes: initialItemRes,
      visitId: visit._id,
      currentArtworkIndex,
      totalArtworks: visit.artworks.length,
      tone: activeTone,
      language: activeLanguage,
      length: activeLength
    });

    // Ciclo interattivo limitato ai 3 comandi item: EXPLAIN_ITEM, NEXT_ITEM, PREVIOUS_ITEM
    while (true) {
      console.log(`\n${colors.bright}--- AZIONI ITEM DISPONIBILI ---${colors.reset}`);
      console.log(`  [1] 🖼️  Spiega opera corrente (EXPLAIN_ITEM)`);
      console.log(`  [2] ⏩ Prossima opera (NEXT_ITEM)`);
      console.log(`  [3] ⏪ Opera precedente (PREVIOUS_ITEM)`);

      /*
      // --- COMANDI DISABILITATI/COMMENTATI COME RICHIESTO ---
      // console.log(` • "Spiegamelo per bambini" / "Più semplice"`);
      // console.log(` • "Voglio dettagli accademici" / "Più approfondito"`);
      // console.log(` • "Dove sta la toilette?" / "Dove sta il bar?" / "Dov'è l'uscita?"`);
      // console.log(` • "Chi è l'autore?"`);
      */

      console.log(`  [q] ❌ Uscire dal test`);

      const choice = await askQuestion(`\n${colors.gold}${colors.bright}Seleziona azione (1, 2, 3 o q) > ${colors.reset}`);
      const trimmedChoice = choice.trim().toLowerCase();

      if (trimmedChoice === 'q' || trimmedChoice === 'exit') {
        console.log(`\n${colors.cyan}Chiusura del Navigator CLI Test. Buona giornata!${colors.reset}\n`);
        break;
      }

      let itemAction = null;
      if (trimmedChoice === '1' || trimmedChoice === 'spiega') {
        itemAction = 'EXPLAIN_ITEM';
      } else if (trimmedChoice === '2' || trimmedChoice === 'prossimo' || trimmedChoice === 'next') {
        itemAction = 'NEXT_ITEM';
      } else if (trimmedChoice === '3' || trimmedChoice === 'precedente' || trimmedChoice === 'prev') {
        itemAction = 'PREVIOUS_ITEM';
      } else {
        console.log(`${colors.red}Scelta non valida. Scegli 1, 2, 3 o q.${colors.reset}`);
        continue;
      }

      // CONFERMA O CAMBIO OBBLIGATORIO DI LINGUA, TONO E LUNGHEZZA
      console.log(`\n${colors.cyan}--- CONFIGURAZIONE PARAMETRI OBBLIGATORI ---${colors.reset}`);
      
      const langInput = await askQuestion(` 🌐 Lingua [it/en/fr/es/de/cn] (corrente: '${activeLanguage}'): ${colors.reset}`);
      if (langInput.trim()) {
        const sanitizedLang = Sanitizer.sanitizeLanguage(langInput);
        if (sanitizedLang) {
          activeLanguage = sanitizedLang;
        } else {
          console.log(`${colors.red} ⚠️ Lingua non valida ('${langInput.trim()}'). Mantenuta lingua corrente: '${activeLanguage}'${colors.reset}`);
        }
      }

      const toneInput = await askQuestion(` 🎭 Tono [infantile/simple/medium/advanced/technical] (corrente: '${activeTone}'): ${colors.reset}`);
      if (toneInput.trim()) {
        const sanitizedTone = Sanitizer.sanitizeTone(toneInput);
        if (sanitizedTone) {
          activeTone = sanitizedTone;
        } else {
          console.log(`${colors.red} ⚠️ Tono non valido ('${toneInput.trim()}'). Mantenuto tono corrente: '${activeTone}'${colors.reset}`);
        }
      }

      const lengthInput = await askQuestion(` ⏱️  Lunghezza in sec [15/30/60] (corrente: ${activeLength}): ${colors.reset}`);
      if (lengthInput.trim()) {
        const sanitizedLength = Sanitizer.sanitizeLength(lengthInput);
        if (sanitizedLength) {
          activeLength = sanitizedLength;
        } else {
          console.log(`${colors.red} ⚠️ Lunghezza non valida ('${lengthInput.trim()}'). Mantenuta lunghezza corrente: ${activeLength}${colors.reset}`);
        }
      }

      console.log(`${colors.gray}[CLI] Esecuzione itemActionHandler('${itemAction}', tone='${activeTone}', length=${activeLength}, lang='${activeLanguage}')...${colors.reset}`);

      try {
        const result = await NavigatorService.itemActionHandler(
          itemAction,
          visit._id,
          currentArtworkIndex,
          activeTone,
          activeLength,
          activeLanguage
        );

        // Aggiorna l'indice corrente se l'azione di navigazione è andata a buon fine
        if (itemAction === 'NEXT_ITEM') currentArtworkIndex++;
        if (itemAction === 'PREVIOUS_ITEM') currentArtworkIndex--;

        await printState({
          itemRes: result,
          visitId: visit._id,
          currentArtworkIndex,
          totalArtworks: visit.artworks.length,
          tone: activeTone,
          language: activeLanguage,
          length: activeLength
        });

      } catch (err) {
        console.log(`\n${colors.red}❌ Errore durante l'azione '${itemAction}': ${err.message}${colors.reset}`);
      }
    }

  } catch (err) {
    console.error(`\n${colors.red}[CLI Error] ${err.message}${colors.reset}`, err);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

async function printState({ itemRes, visitId, currentArtworkIndex, totalArtworks, tone, language, length }) {
  const item = itemRes?.item || itemRes;
  const fromCache = itemRes?.fromCache ?? false;

  // Estrae il testo sia se itemRes è una stringa di testo pura, sia se è un oggetto Item
  const textToDisplay = typeof item === 'string' ? item : (item?.description || JSON.stringify(item));

  // Carica l'opera target per la stampa a terminale
  const targetArtworkId = (typeof item === 'object' && item?.artwork) 
    ? item.artwork 
    : await NavigatorService.getArtworkId(visitId, currentArtworkIndex);

  const artwork = await Artwork.findById(targetArtworkId).populate('artists').exec();

  console.log(`\n${colors.gold}=========================================================================${colors.reset}`);
  console.log(`${colors.bright}🖼️  OPERA ${currentArtworkIndex + 1}/${totalArtworks}: "${artwork?.title || 'Opera'}"${colors.reset}`);
  console.log(`📍 Posizione: Stanza "${artwork?.location?.room || 'Galleria Principale'}", Piano: ${artwork?.location?.floor || 'Piano Terra'}`);
  console.log(`🏷️ QR Code: [${artwork?.qrCode || 'ART_QR'}]`);
  
  console.log(`\n${colors.green}${colors.bright}🔊 CONTENUTO (Tono: ${tone.toUpperCase()}, Lingua: ${language.toUpperCase()}, Durata: ${length}s):${colors.reset}`);
  console.log(`${colors.bright}"${textToDisplay}"${colors.reset}`);

  const isAI = typeof item === 'object' ? item?.isAIGenerated : true;
  const author = typeof item === 'object' ? (item?.authorName || 'AI Engine') : 'AI Engine';

  const sourceLabel = fromCache 
    ? `${colors.green}⚡ Cache MongoDB (Risposta Istantanea 0ms)${colors.reset}` 
    : `${colors.magenta}✨ Generato al volo da AI API / Adaptor${colors.reset}`;

  console.log(`\n${colors.cyan}🔍 [DEBUG INFO ITEM]:${colors.reset}`);
  console.log(`   • 📦 Provenienza Contenuto  : ${sourceLabel}`);
  console.log(`   • 📝 Generato da AI        : ${isAI ? 'Sì (AI Engine)' : 'No (Testo Autore Umano)'}`);
  console.log(`   • 👤 Autore Registrato     : ${author}`);
  console.log(`${colors.gold}=========================================================================${colors.reset}`);
}

main();
