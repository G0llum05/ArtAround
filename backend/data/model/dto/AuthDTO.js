/**
 * Data Transfer Objects (DTO) per i flussi di Autenticazione e Gestione Ruoli.
 */

class RegisterRequestDTO {
  constructor(name, surname, email, password, role) {
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.password = password;
    this.role = role; // Può richiedere 'teacher' o 'museumstaff' (che andranno in pending) o lasciare default
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
