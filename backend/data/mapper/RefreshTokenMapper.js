const { NewRefreshTokenDTO } = require('../model/dto/RefreshTokenDTO');

class RefreshTokenMapper {
  static toNewRefreshTokenDTO(token, userId, expiresAt, createdByIp) {
    if (typeof token === 'object' && token !== null) {
      return new NewRefreshTokenDTO(
        token.token,
        token.userId,
        token.expiresAt,
        token.createdByIp
      );
    }
    const dto = new NewRefreshTokenDTO(
      token,
      userId,
      expiresAt,
    );
    dto.createdByIp = createdByIp || null;
    return dto;
  }
}

module.exports = RefreshTokenMapper;
