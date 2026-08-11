class NewRefreshTokenDTO {
  constructor(token, userId, expiresAt) {
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.createdByIp = null;
  }
}

module.exports = {
  NewRefreshTokenDTO
};
