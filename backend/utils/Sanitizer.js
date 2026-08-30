class Sanitizer {
  static ALLOWED_LANGS = ['it', 'en', 'fr', 'es', 'de', 'cn', 'ru'];
  static ALLOWED_TONES = ['infantile', 'simple', 'medium', 'technical'];
  static ALLOWED_LENGTHS = [15, 30, 60];
  static ALLOWED_POIS = ['toilette', 'bar', 'exit', 'elevator', 'ticket_office', 'info_point'];

  static sanitizeLanguage(lang) {
    const clean = typeof lang === 'string' ? lang.toLowerCase().trim() : '';
    return this.ALLOWED_LANGS.includes(clean) ? clean : null;
  }

  static sanitizeTone(tone) {
    const clean = typeof tone === 'string' ? tone.toLowerCase().trim() : '';
    return this.ALLOWED_TONES.includes(clean) ? clean : null;
  }

  static sanitizeLength(length) {
    const len = parseInt(length, 10);
    return this.ALLOWED_LENGTHS.includes(len) ? len : null;
  }

  static sanitizePoi(poi) {
    const clean = typeof poi === 'string' ? poi.toLowerCase().trim() : '';
    return this.ALLOWED_POIS.includes(clean) ? clean : null;
  }

  static cleanTextForVoice(text) {
    if (!text || typeof text !== 'string') return '';

    let clean = text;

    // Rimuove tag di annotazione mock o metadati tra parentesi quadre tipo [AI Storyteller] o [AI Adaptation...]
    clean = clean.replace(/\[(?:AI Storyteller|AI Adaptation[^\]]*|DEBUG[^\]]*)\]\s*/gi, '');

    // Rimuove blocchi di codice markdown
    clean = clean.replace(/```[\s\S]*?```/g, '');
    clean = clean.replace(/`([^`]+)`/g, '$1');

    // Rimuove formattazione markdown (grassetto, corsivo, intestazioni, barrato)
    clean = clean.replace(/[*_~#>`]/g, '');

    // Rimuove elenchi puntati o numerati trasformandoli in testo continuo
    clean = clean.replace(/^[ \t]*[•\-\+\*][ \t]+/gm, '');
    clean = clean.replace(/[•\-\+\*][ \t]+/g, ' ');
    clean = clean.replace(/^[ \t]*\d+\.[ \t]+/gm, '');

    // Rimuove emoji e simboli grafici speciali
    clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');

    // Converte simboli di valuta in testo pronunciabile naturale
    clean = clean.replace(/(\d+)\s*€/g, '$1 euro');
    clean = clean.replace(/€\s*(\d+)/g, '$1 euro');

    // Rimuove caratteri speciali indesiderati lasciando solo punteggiatura standard
    clean = clean.replace(/[\\\/\|\^~«»"'{}\[\]<>@#$%&=]/g, ' ');

    // Normalizza spazi multipli e ritorni a capo
    clean = clean.replace(/\r?\n+/g, ' ');
    clean = clean.replace(/\s{2,}/g, ' ');

    return clean.trim();
  }
}

module.exports = Sanitizer;
