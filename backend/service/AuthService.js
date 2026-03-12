const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserMapper = require('../data/mapper/UserMapper');
const UserService = require('../service/UserService');

class AuthService {
    async login(loginData) {
        try {
            const user = await UserService.getUserByMail(loginData.mail);
        } catch (err) {
            throw new Error('Credenziali non valide');
        }
        // Utility che fa il compare tra le due pw
        if(!bcrypt.compareSync(loginData.password, user.password)) {
            throw new Error('Credenziali non valide'); //maggiore sicurezza rimanendo vaghi
        }
        
        const userDTO = UserMapper.toUserResponseDTO(user);

        const payload = { id: userDTO.id, mail: userDTO.mail };
        // Fa schifo
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return { token, userDTO };
    }
}

module.exports = new AuthService();
