const { ArtistResponseDTO, ArtistRequestDTO } = require('../model/dto/ArtistDTO');

class ArtistMapper {
  static toArtistResponseDTO(artistModel) {
    if (!artistModel) return null;
    return new ArtistResponseDTO(
      artistModel._id,
      artistModel.name,
      artistModel.surname,
      artistModel.artworks,
      artistModel.artisticCurrents,
      artistModel.followerOf,
      artistModel.teacherOf
    );
  }

  static toArtistRequestDTO(dto) {
    if (!dto) return null;
    return new ArtistRequestDTO(
      dto.name,
      dto.surname,
      dto.artworks,
      dto.artisticCurrents,
      dto.followerOf,
      dto.teacherOf
    );
  }
}

module.exports = ArtistMapper;
