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
      artistModel.teacherOf,
      artistModel.assets || { images: [] }
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
      dto.teacherOf,
      dto.assets || { images: [] }
    );
  }

  static toArtistModel(dto) {
    if (!dto) return null;
    const cleanId = (id) => (id && typeof id === 'string' && id.trim() !== "") ? id : (typeof id === 'object' && id?._id ? id._id : id);

    return {
      name: dto.name,
      surname: dto.surname,
      artworks: Array.isArray(dto.artworks) ? dto.artworks.map(cleanId).filter(Boolean) : dto.artworks,
      artisticCurrents: dto.artisticCurrents || [],
      followerOf: Array.isArray(dto.followerOf) ? dto.followerOf.map(cleanId).filter(Boolean) : (dto.followerOf ? [cleanId(dto.followerOf)] : []),
      teacherOf: Array.isArray(dto.teacherOf) ? dto.teacherOf.map(cleanId).filter(Boolean) : (dto.teacherOf ? [cleanId(dto.teacherOf)] : []),
      assets: dto.assets || { images: [] }
    };
  }
}

module.exports = ArtistMapper;
