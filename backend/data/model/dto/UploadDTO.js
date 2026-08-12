class UploadMuseumImgDTO {
  constructor(museumId, file, orientation) {
    this.museumId = museumId;
    this.file = file;
    this.orientation = orientation;
  }
}

class UploadVisitImgDTO {
  constructor(museumId, visitId, file, orientation) {
    this.museumId = museumId;
    this.visitId = visitId;
    this.file = file;
    this.orientation = orientation;
  }
}

class UploadArtworkImgDTO {
  constructor(museumId, artworkId, file, orientation) {
    this.museumId = museumId;
    this.artworkId = artworkId;
    this.file = file;
    this.orientation = orientation;
  }
}

class UploadArtistImgDTO {
  constructor(artistId, file, orientation) {
    this.artistId = artistId;
    this.file = file;
    this.orientation = orientation;
  }
}

class UploadUserPropicDTO {
  constructor(userId, file, orientation) {
    this.userId = userId;
    this.file = file;
    this.orientation = orientation;
  }
}

module.exports = {
  UploadMuseumImgDTO,
  UploadVisitImgDTO,
  UploadArtworkImgDTO,
  UploadArtistImgDTO,
  UploadUserPropicDTO
};

