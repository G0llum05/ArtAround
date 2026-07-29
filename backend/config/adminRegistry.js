/**
 * Registro centrale degli indirizzi email degli Amministratori di Sistema.
 * In base ai requisiti di progetto, i 3 creatori (Mattia Graziani, Davide Gamberini, Samuele Grillini)
 * hanno diritto esclusivo al ruolo 'admin'.
 */

const ADMIN_EMAILS = new Set([
  'mattiagraziani05@gmail.com',
  // Aggiungere qui le email degli altri 2 creatori non appena disponibili:
  // 'davide.gamberini@example.com',
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
