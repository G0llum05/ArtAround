const { UploadMuseumImgDTO, UploadVisitImgDTO, UploadArtworkImgDTO, UploadArtistImgDTO, UploadUserPropicDTO } = require('../model/dto/UploadDTO');

class UploadMapper {
  static toUploadMuseumImgDTO(req) {
    if (!req) return null;
    return new UploadMuseumImgDTO(
      req.body.museumId,
      req.file,
      req.body.orientation
    );
  }

  static toUploadVisitImgDTO(req) {
    if (!req) return null;
    return new UploadVisitImgDTO(
      req.body.museumId,
      req.body.visitId,
      req.file,
      req.body.orientation
    );
  }

  static toUploadArtworkImgDTO(req) {
    if (!req) return null;
    return new UploadArtworkImgDTO(
      req.body.museumId,
      req.body.artworkId,
      req.file,
      req.body.orientation
    );
  }

  static toUploadArtistImgDTO(req) {
    if (!req) return null;
    return new UploadArtistImgDTO(
      req.body.artistId,
      req.file,
      req.body.orientation
    );
  }

  static toUploadUserPropicDTO(req) {
    if (!req) return null;
    return new UploadUserPropicDTO(
      req.body.userId,
      req.file,
      req.body.orientation
    );
  }
}

module.exports = UploadMapper;

