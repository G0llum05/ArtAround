const mailer = require('nodemailer');

const NOREPLY_MAIL_ADDRESS = "noreply.artaround@gmail.com";


// configura il trasportatore
const transporter = mailer.createTransport({
  service: 'gmail', // utilizza configurazione smtp di google
  auth: {
    user: NOREPLY_MAIL_ADDRESS,
    pass: process.env.NOREPLY_PASSWORD
  }
});

async function sendLoginConfirmation(userEmail, userName, code, accessMode) {
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
      case "GOOGLE":
        subject = 'No-reply: Codice di verifica acesso ArtAround';
        message = `
          <h3>Ciao ${userName},</h3>
          <p>Abbiamo rilevato un nuovo tentativo di login al tuo account ArtAround tramite <strong>Google</strong>.</p>
          <p>Dobbiamo verificare che sia veramente tu a voler accedere dato che hai già un account registrato in ArtAround</p>
          <p>Il tuo codice di verifica per completare la verifica è: <strong style="font-size: 1.25rem; color: #9f3d25;">${code}</strong></p>
          <br>
          <p>Horash ArtAround</p>
        `;

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


module.exports = {
  sendLoginConfirmation
}
