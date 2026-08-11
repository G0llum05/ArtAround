const { NewRefreshTokenDTO } = require('../model/dto/RefreshTokenDTO');

class RefreshTokenMapper {
  static toNewRefreshTokenDTO(refreshTokenModel) {
    if (!refreshTokenModel) return null;
    return new NewRefreshTokenDTO(
      refreshTokenModel.userId,
      refreshTokenModel.token,
      refreshTokenModel.expiresAt,
      refreshTokenModel.createdByIp
    );
  }
}

module.exports = RefreshTokenMapper;
