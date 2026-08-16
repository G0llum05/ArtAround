const { SignupRequestDTO, LoginRequestDTO, RoleUpgradeRequestDTO, StudentAssignRequestDTO, GoogleProfileDTO, LoginResponseDTO } = require('../model/dto/AuthDTO');

class AuthMapper {
  static toSignupRequestDTO(body) {
    if (!body) return null;
    return new SignupRequestDTO(body.name, body.surname, body.email, body.password, body.gender);
  }

  static toLoginRequestDTO(body, ip) {
    if (!body) return null;
    return new LoginRequestDTO(body.email, body.password, ip);
  }

  static toRoleUpgradeRequestDTO(body) {
    if (!body) return null;
    return new RoleUpgradeRequestDTO(body.requestedRole);
  }

  static toStudentAssignRequestDTO(body) {
    if (!body) return null;
    return new StudentAssignRequestDTO(body.email, body.organization);
  }

  static toGoogleProfileDTO(profile) {
    if (!profile) return null;
    const googleId = profile.id;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
    const name = (profile.name && profile.name.givenName) ? profile.name.givenName : (profile.displayName || 'User');
    const surname = (profile.name && profile.name.familyName) ? profile.name.familyName : '';
    // const gender = profile.name.gender
    return new GoogleProfileDTO(googleId, email, name, surname);
  }

  static toLoginResponseDTO(user, accessToken, refreshToken, type, message) {
    if (!user || !accessToken || !refreshToken) return null;
    return new LoginResponseDTO(user, accessToken, refreshToken, type, message);
  }
}

module.exports = AuthMapper;
