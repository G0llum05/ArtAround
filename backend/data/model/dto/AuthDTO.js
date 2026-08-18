/**
 * Data Transfer Objects (DTO) per i flussi di Autenticazione e Gestione Ruoli.
 */

class SignupRequestDTO {
  constructor(name, surname, email, password, gender = 'other') {
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.password = password;
    this.gender = gender;
  }
}

class LoginRequestDTO {
  constructor(email, password, ip) {
    this.email = email;
    this.password = password;
    this.ip = ip;
  }
}

class RoleUpgradeRequestDTO {
  constructor(requestedRole) {
    this.requestedRole = requestedRole; // 'teacher' o 'museumstaff'
  }
}

class StudentAssignRequestDTO {
  constructor(email, organization) {
    this.email = email;
    this.organization = organization;
  }
}

class GoogleProfileDTO {
  constructor(googleId, email, name, surname) {
    this.googleId = googleId;
    this.email = email;
    this.name = name;
    this.surname = surname;
  }
}

class LoginResponseDTO {
  constructor(user, accessToken, refreshToken, type, message) {
    this.type = type;
    this.message = message;
    this.userId = user._id;
    this.name = user.name;
    this.surname = user.surname;
    this.email = user.email;
    this.gender = user.gender || 'other';
    this.role = user.role;
    const defaultPropicUrl = '/assets/users/default/propic/default.jpeg';
    this.assets = {
      profilePicture: {
        url: user.assets?.profilePicture?.url || defaultPropicUrl,
        orientation: user.assets?.profilePicture?.orientation || 'square'
      }
    };
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

module.exports = {
  SignupRequestDTO,
  LoginRequestDTO,
  RoleUpgradeRequestDTO,
  StudentAssignRequestDTO,
  GoogleProfileDTO,
  LoginResponseDTO
};
