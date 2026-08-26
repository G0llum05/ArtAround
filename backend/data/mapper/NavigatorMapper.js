const { NavigatorRequestDTO, NavigatorResponseDTO } = require('../model/dto/NavigatorDTO');

class NavigatorMapper {
  static toNavigatorRequestDTO(req) {
    if (!req) return null;
    return new NavigatorRequestDTO(
      req.body,
      req.file
    );
  }

  static toNavigatorResponseDTO(navigatorModel, audio = null) {
    if (!navigatorModel) return null;
    return new NavigatorResponseDTO(
      navigatorModel,
      audio
    );
  }
}

module.exports = NavigatorMapper;
