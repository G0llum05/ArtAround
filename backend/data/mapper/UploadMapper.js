const { UploadMuseumImgDTO, UploadVisitImgDTO, UploadArtworkImgDTO, UploadArtistImgDTO, UploadUserPropicDTO } = require('../model/dto/UploadDTO');

class UploadMapper {
  static toUploadMuseumImgDTO(req) {
    if (!req) return null;
    return new UploadMuseumImgDTO(
      req.params?.museumId,
      req.file || req.files?.[0],
      req.body?.orientation
    );
  }

  static toUploadVisitImgDTO(req) {
    if (!req) return null;
    return new UploadVisitImgDTO(
      req.params?.museumId,
      req.params?.visitId,
      req.file || req.files?.[0],
      req.body?.orientation
    );
  }

  static toUploadArtworkImgDTO(req) {
    if (!req) return null;
    return new UploadArtworkImgDTO(
      req.params?.museumId,
      req.params?.artworkId,
      req.file || req.files?.[0],
      req.body?.orientation
    );
  }

  static toUploadArtistImgDTO(req) {
    if (!req) return null;
    return new UploadArtistImgDTO(
      req.params?.artistId,
      req.files?.[0],
      req.body?.orientation
    );
  }

  static toUploadUserPropicDTO(req) {
    if (!req) return null;
    return new UploadUserPropicDTO(
      req.params?.userId || req.body?.userId,
      req.file || req.files?.[0],
      req.body?.orientation
    );
  }
}

module.exports = UploadMapper;

