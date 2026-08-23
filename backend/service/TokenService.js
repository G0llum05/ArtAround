const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const MapperRefreshToken = require('../data/mapper/RefreshTokenMapper');
const RefreshToken = require('../data/model/RefreshToken');
const VerificationCode = require('../data/model/VerificationCode');
const User = require('../data/model/User');
const mailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_DAYS = 7;
// Verification vars
const MAX_ATTEMPTS = 5;
const NOREPLY_MAIL_ADDRESS = "noreply.artaround@gmail.com";

// Configura il trasportatore Nodemailer per l'invio delle email
const transporter = mailer.createTransport({
  service: 'gmail',
  auth: {
    user: NOREPLY_MAIL_ADDRESS,
    pass: process.env.NOREPLY_PASSWORD
  }
});

class TokenService {

  /**
    * crea access token
    */
  generateAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION }); // la libreria aggiunge timestamp e exp di scadenza automaticamente
  }


  /**
    * verifica access token e restituisce contenuto
    */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET); // la funzione fa: - divide il token in header, payload e signature - decodifica il payload - controlla scadenza - verifica firma - ritorna il payload decodificato
    } catch (error) {
      return error
    }
  }


  /**
    * crea refresh token
    */
  async generateRefreshToken(user, ipAddress) {
    const randomToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    const refreshToken = MapperRefreshToken.toNewRefreshTokenDTO(randomToken, user._id, expiresAt, ipAddress);

    // salva il refresh token nel database
    await RefreshToken.create(
      refreshToken
    );

    return randomToken;
  }


  /**
  * verifica esistenza e validità refresh token da db
  */
  async verifyAndGetRefreshToken(token) {
    if (!token) return null;
    
    const refreshToken = await RefreshToken.findOne({ token: token }).populate('userId');
    if (!refreshToken || refreshToken.expiresAt < new Date() || refreshToken.isRevoked) {
      return null;
    }
    return refreshToken;
  }
  
  
  /**
    * invalida (revoca) un singolo refresh token.
    */
  async revokeRefreshToken(tokenString, replacedByToken = null) {
    const refreshToken = await RefreshToken.findOne({ token: tokenString });
    if (!refreshToken) return;
  
    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();
    if (replacedByToken) {
      refreshToken.replacedByToken = replacedByToken;
    }
    await refreshToken.save();
  }
  
  
  /**
    * revoca tutti i refresh token di un utente.
    */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
  
  
  /**
    * revoca i refresh token di un indirizzo ip dell'utente
    */
  async revokeAllUserTokensFromIp(userId, ipAddress) {
    await RefreshToken.updateMany(
      { userId: userId, createdByIp: ipAddress, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
  
  // ----- VERIFICATION TOKEN ----- //
  
  getMaxAttempts() {
    return MAX_ATTEMPTS;
  }

  /**
   * Invia una mail con un codice di verifica OTP alla mail dell'utente,
   * crea un VerificationCode token della durata di 10 min, se l'utente dopo i 10 min non ha verificato
   * il suo account, questo viene eliminato
   */
  async sendMailConfirmation(userEmail, userName, code, accessMode) {
    const startTime = Date.now();
    console.log(`[Mailer Debug] [${new Date().toISOString()}] Avvio invio email a: ${userEmail}...`);
    try {
      let message;
      let subject;
      switch (accessMode) {
        case "SIGNIN":
          subject = 'No-reply: Codice di verifica accesso ArtAround';
          message = `
            <h3>Ciao ${userName},</h3>
            <p>Abbiamo rilevato un nuovo tentativo di login al tuo account ArtAround.</p>
            <p>Il tuo codice di verifica è: <strong style="font-size: 1.25rem; color: #9f3d25;">${code}</strong></p>
            <p>Se non sei stato tu, ti consigliamo di cambiare subito la password.</p>
            <br>
            <p>Horash ArtAround</p>
          `;
          break;
        case "SIGNUP":
          subject = 'No-reply: Codice di verifica registrazione ArtAround';
          message = `
            <h3>Ciao ${userName},</h3>
            <p>Ti ringraziamo per aver scelto <strong>ArtAround</strong>!</p>
            <p>Il tuo codice di verifica per completare la registrazione è: <strong style="font-size: 1.25rem; color: #9f3d25;">${code}</strong></p>
            <p>Inserisci questo codice nell'applicazione per attivare il tuo profilo.</p>
            <br>
            <p>Horash ArtAround</p>
          `;
          break;
      }
      const mailOptions = {
        from: `Horash ArtAround <${NOREPLY_MAIL_ADDRESS}>`, // Mittente
        to: userEmail, // Destinatario (email dell'utente)
        subject: subject,
        html: message
      };

      const sendStart = Date.now();
      const info = await transporter.sendMail(mailOptions);
      const duration = Date.now() - sendStart;
      const totalDuration = Date.now() - startTime;
      console.log(`[Mailer Debug] [${new Date().toISOString()}] Email inviata con successo in ${duration}ms (Totale: ${totalDuration}ms). Risposta SMTP:`, info.response);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`[Mailer Debug] [${new Date().toISOString()}] Errore durante l'invio dell'email dopo ${totalDuration}ms:`, error);
    }
  }


  /**
   * crea il codice di verifica per l'acesso mail-password
   */
  async createVerificationMailCode(user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // alcola la scadenza: 10 minuti da adesso
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Rimuove tutti i codici vecchi (non necessariamente scaduti) e ne crea un nuovo
    await VerificationCode.deleteMany({ userId: user._id });
    await new VerificationCode({
      userId: user._id,
      code: code,
      expiresAt: expiresAt
    }).save();
    return code;
  }

  /**
   * Rimuove un utente non verificato ed il relativo codice dal DB.
   */
  async removeUnverifiedUser(userId) {
    if (!userId) return;
    await VerificationCode.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
  }

  /**
   * Cerca se esiste un codice attivo (non scaduto) per l'utente
   */
  async getActiveCode(userId) {
    // per un solo user ci sarà un solo codice di verifica e sarà quello corretto
    const activeCodeRecord = await VerificationCode.findOne({ userId });

    // Ritorna il record solo se esiste ed è effettivamente valido nel tempo
    if (activeCodeRecord && activeCodeRecord.expiresAt > new Date()) {
      return activeCodeRecord;
    }

    return null;
  }

  /**
   * Verifica se il codice inserito dall'utente è corretto.
   * Se il codice è scaduto o sono stati superati i tentativi massimi, l'utente viene rimosso dal DB.
   */
  async verifyCode(userId, inputCode) {
    const rawTokenRecord = await VerificationCode.findOne({ userId });

    // Se il codice non esiste o è scaduto, rimuovi l'utente dal DB
    if (!rawTokenRecord || rawTokenRecord.expiresAt <= new Date()) {
      await this.removeUnverifiedUser(userId);
      throw new Error('Codice di verifica scaduto. La registrazione non verificata è stata annullata per sicurezza. Effettua nuovamente la registrazione.');
    }

    // Se l'utente ha già raggiunto o superato i tentativi massimi
    if (rawTokenRecord.attempts >= MAX_ATTEMPTS) {
      await this.removeUnverifiedUser(userId);
      throw new Error(`Hai raggiunto il numero massimo di tentativi (${MAX_ATTEMPTS}). Il profilo non verificato è stato rimosso. Effettua nuovamente la registrazione.`);
    }

    // Se il codice inserito è errato
    if (rawTokenRecord.code !== String(inputCode).trim()) {
      rawTokenRecord.attempts += 1;
      await rawTokenRecord.save();

      const remainingAttempts = MAX_ATTEMPTS - rawTokenRecord.attempts;
      if (remainingAttempts <= 0) {
        await this.removeUnverifiedUser(userId);
        throw new Error(`Codice errato. Hai raggiunto il numero massimo di tentativi (${MAX_ATTEMPTS}). Il profilo non verificato è stato rimosso. Effettua nuovamente la registrazione.`);
      }
      throw new Error(`Codice errato. Tentativi rimasti: ${remainingAttempts}`);
    }

    // Rimozione del codice di verifica una volta convalidato con successo
    await VerificationCode.findByIdAndDelete(rawTokenRecord._id);

    return true;
  }

}

module.exports = new TokenService();
