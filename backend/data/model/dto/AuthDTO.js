/**
 * Data Transfer Objects (DTO) per i flussi di Autenticazione e Gestione Ruoli.
 */

class RegisterRequestDTO {
  constructor(name, surname, email, password) {
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.password = password;
  }
}

class LoginRequestDTO {
  constructor(email, password) {
    this.email = email;
    this.password = password;
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

class AuthResponseDTO {
  constructor(user, accessToken) {
    this.user = user;
    this.accessToken = accessToken;
  }
}

module.exports = {
  RegisterRequestDTO,
  LoginRequestDTO,
  RoleUpgradeRequestDTO,
  StudentAssignRequestDTO,
  AuthResponseDTO
};
