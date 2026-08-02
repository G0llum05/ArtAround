/**
 * Registro centrale degli indirizzi email degli Amministratori di Sistema.
 * In base ai requisiti di progetto, i 3 creatori (Mattia Graziani, Davide Gamberini, Samuele Grillini)
 * hanno diritto esclusivo al ruolo 'admin'.
 */

const ADMIN_EMAILS = new Set([
  'mattiagraziani05@gmail.com',
  'davide.gamberini.2005@gmail.com'
  // Aggiungere qui l'email del 3° creatore non appena disponibile:
  // 'samuele.grillini@example.com'
]);

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

module.exports = {
  ADMIN_EMAILS,
  isAdminEmail
};
