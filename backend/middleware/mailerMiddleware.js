const mailer = require('nodemailer');

const NOREPLY_MAIL_ADDRESS = "noreply.artaround@gmail.com";


// 1. Configura il trasportatore (Transporter)
const transporter = mailer.createTransport({
      service: 'gmail', // utilizza configurazione smtp di google
      auth: {
          user: NOREPLY_MAIL_ADDRESS,
          pass: process.env.NOREPLY_PASSWORD
      }
  });

async function sendLoginConfirmation  (userEmail, userName, code) {
  try {
    const mailOptions = {
      from: `Horash ArtAround <${NOREPLY_MAIL_ADDRESS}>`, // Mittente
      to: userEmail, // Destinatario (email dell'utente)
      subject: 'No-reply: Conferma nuovo accesso su ArtAround', 
      html: `
        <h3>Ciao ${userName},</h3>
        <p>Abbiamo rilevato un nuovo login al tuo account.</p>
        <p>Il tuo codice di verifica è <strong>${code}</strong></p>
        <p>Se non sei stato tu, ti consigliamo di cambiare subito la password.</p>
        <br>
        <p>Horash ArtAround</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email inviata con successo: ' + info.response);
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
  }
}

module.exports = {
  sendLoginConfirmation
}