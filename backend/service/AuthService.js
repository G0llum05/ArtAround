const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../data/model/User');

class AuthService {

  async getUserByGoogleId(id) {
      return await User.findOne({ googleId: id }).lean();
  }

  async getUserByEmail(email) {
      return await User.findOne( {email} ).lean();
  }


  async findOrCreateGoogleUser(profile) {
      try {
        let user = await this.getUserByGoogleId(profile.id);
        
        // An user with this Google ID already exists
        if (user) {
          return user;
        }
  
        // If an user is found with the same email (i.e. with the internal registration), link the Google ID to that user and merge the accounts log in
        user = await this.getUserByEmail(profile.emails[0].value);
        if (user) {
          user.googleId = profile.id;
          await user.save();
          return user;
        }
  
      let assignedRole = 'guest';
      const email = profile.emails[0].value;

      // if (email.endsWith('@unibo.it')) {
      //   assignedRole = 'prof'; // Esempio: se è una email istituzionale
      // }
      // Puoi aggiungere una lista di email per gli admin
      // if (email === 'tuamail@gmail.com') {
      //   assignedRole = 'admin';
      // }

      const newUser = new User({
        googleId: profile.id,
        email: email,
        name: profile.name.givenName || profile.displayName,
        surname: profile.name.familyName || ' ', // some Google profiles might not have a surname
        role: assignedRole
      });
  
        await newUser.save();
        return newUser;
  
      } catch (error) {
        throw error;
      }
    }


    async registerLocalUser(loginData) {
      const existingUser = await this.getUserByEmail(loginData.email);
      if (existingUser) throw new Error('Email già in uso');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(loginData.password, salt);

      const newUser = new User({
        name: loginData.name,
        surname: loginData.surname,
        email: loginData.email,
        password: hashedPassword,
        role: loginData.role
      });

      await newUser.save();
      return newUser;
    }

    async verifyLocalUser(email, password) {
      const user = await this.getUserByEmail(email);
      // user doesn't exist
      if (!user) throw new Error('Invalid credentials');

      // user registered only with Google, he doesn't have a password
      if (!user.password) throw new Error('Invalid credentials');

      const isMatch = await bcrypt.compare(password, user.password);

      // password doesn't match
      if (!isMatch) throw new Error('Invalid credentials');

      return user;
    }
  
    generateToken(user) {
      const payload = { id: user._id, email: user.email, role: user.role };
      return jwt.sign(payload, process.env.JWT_SECRET || 'SEGRETO', { expiresIn: '8h' });
    }
}

module.exports = new AuthService();
