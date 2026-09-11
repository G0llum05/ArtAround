const messages = require('../config/navigator-messages.json');

class NavigatorMessages {
  /**
   * Restituisce il messaggio localizzato per la chiave specificata.
   * @param {string} key - Chiave identificativa del messaggio (es. 'tour_already_at_last')
   * @param {string} [lang='it'] - Codice della lingua (es. 'it', 'en', 'es', 'fr', 'de', 'pt')
   * @param {Record<string, any>} [params={}] - Parametri opzionali da sostituire (es. { title: 'Gioconda' })
   * @returns {string} Messaggio pronto per la risposta vocale o di testo
   */
  static getMessage(key, lang = 'it', params = {}) {
    const rawLang = typeof lang === 'string' ? lang.toLowerCase().trim() : 'it';
    const entry = messages[key];
    if (!entry) return key;

    // Ricerca lingua: lingua richiesta -> italiano ('it') -> inglese ('en') -> prima lingua presente
    let template = entry[rawLang] || entry['it'] || entry['en'] || Object.values(entry)[0] || '';

    // Sostituzione placeholder come {{nomeParametro}}
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        const val = paramValue !== undefined && paramValue !== null ? String(paramValue) : '';
        template = template.replace(new RegExp(`{{${paramKey}}}`, 'g'), val);
      });
    }

    return template;
  }
}

module.exports = NavigatorMessages;
