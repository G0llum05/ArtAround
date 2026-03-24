const authService = require('../../service/AuthService');

class AuthController {
  
  googleCallback(req, res) {
    if (!req.user) return res.redirect('/login?error=auth_failed');
    const token = authService.generateToken(req.user);
    res.redirect(`/login-success?token=${token}`);
  }

  // Registrazione Locale
  async register(req, res) {
    try {
      await authService.registerLocalUser(req.body);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  login(req, res) {
    // Se siamo qui, Passport ha già verificato email/password con successo
    // e ha messo l'utente in req.user
    const token = authService.generateToken(req.user);
    
    // Niente redirect qui! Angular sta aspettando una risposta JSON
    res.json({ token: token, message: 'Login effettuato' }); 
  }
}

module.exports = new AuthController();
// const AuthService = require('../../service/AuthService');
//
// class AuthController {
//     async login (req, res) {
//         try {
//             const { email, password } = req.body;
//             const result = await AuthService.login(email, password);
//             res.json(result);
//         } catch (error) {
//             res.status(401).json({ message: error.message});
//         }
//     }
//
//     profile(req, res) {
//         res.json({ message: "Accesso consentito", user: req.user });
//     } 
// }
//
// module.exports = { AuthController };
