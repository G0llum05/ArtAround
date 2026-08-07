class Sanitizer {
  static ALLOWED_LANGS = ['it', 'en', 'fr', 'es', 'de', 'cn', 'ru'];
  static ALLOWED_TONES = ['infantile', 'simple', 'medium', 'advanced', 'technical'];
  static ALLOWED_LENGTHS = [15, 30, 60];
  static ALLOWED_POIS = ['toilette', 'bar', 'exit', 'elevator', 'ticket_office', 'info_point'];

  static sanitizeLanguage(lang, fallback = 'it') {
    const clean = typeof lang === 'string' ? lang.toLowerCase().trim() : '';
    return this.ALLOWED_LANGS.includes(clean) ? clean : fallback;
  }

  static sanitizeTone(tone, fallback = 'medium') {
    const clean = typeof tone === 'string' ? tone.toLowerCase().trim() : '';
    return this.ALLOWED_TONES.includes(clean) ? clean : fallback;
  }

  static sanitizeLength(length, fallback = 30) {
    const len = parseInt(length, 10);
    return this.ALLOWED_LENGTHS.includes(len) ? len : fallback;
  }

  static sanitizePoi(poi) {
    const clean = typeof poi === 'string' ? poi.toLowerCase().trim() : '';
    return this.ALLOWED_POIS.includes(clean) ? clean : null;
  }
}

module.exports = Sanitizer;
