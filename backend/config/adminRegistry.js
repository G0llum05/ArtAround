/**
 * Registro centrale degli indirizzi email degli Amministratori di Sistema.
 * In base ai requisiti di progetto, i 3 creatori (Mattia Graziani, Davide Gamberini, Samuele Grillini)
 * hanno diritto esclusivo al ruolo 'admin'.
 */

const ADMIN_EMAILS = new Set([
  process.env.ADMIN1,
  process.env.ADMIN2,
  process.env.ADMIN3
]);

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

module.exports = {
  ADMIN_EMAILS,
  isAdminEmail
};
