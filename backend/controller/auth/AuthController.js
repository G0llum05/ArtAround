const AuthService = require('../../service/AuthService');

class AuthController {
    async login (req, res) {
        try {
            const { mail, password } = req.body;
            const result = await AuthService.login(mail, password);
            res.json(result);
        } catch (error) {
            res.status(401).json({ message: error.message});
        }
    }

    profile(req, res) {
        res.json({ message: "Accesso consentito", user: req.user });
    } 
}

module.exports = { AuthController };