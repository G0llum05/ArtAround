const { ArtworkResponseDTO, ArtworkRequestDTO } = require('../model/dto/ArtworkDTO');

class ArtworkMapper {
  static toArtworkResponseDTO(artworkModel) {
    if (!artworkModel) return null;
    return new ArtworkResponseDTO(
      artworkModel._id,
      artworkModel.title,
      artworkModel.description,
      artworkModel.startYear,
      artworkModel.endYear,
      artworkModel.artists,
      artworkModel.museum,
      artworkModel.location,
      artworkModel.dimensions,
      artworkModel.artisticCurrents,
      artworkModel.details,
      artworkModel.copyOf,
      artworkModel.falsificationOf,
      artworkModel.isActive,
      artworkModel.isPrivate,
      artworkModel.qrCode,
      artworkModel.images,
      artworkModel.items
    );
  }

  static toArtworkModel(dto) {
    if (!dto) return null;

    // Funzione di utilità per pulire gli ID: se è una stringa vuota, diventa undefined
    const cleanId = (id) => (id && id.trim() !== "") ? id : undefined;

    return {
      title: dto.title,
      description: dto.description,
      startYear: dto.startYear,
      endYear: dto.endYear,
      // Puliamo gli ID nell'array artists
      artists: Array.isArray(dto.artists) ? dto.artists.filter(id => id && typeof id === 'string' && id.trim() !== "") : dto.artists,
      museum: cleanId(dto.museum),
      location: dto.location,
      dimensions: dto.dimensions,
      artisticCurrents: dto.artisticCurrents,
      details: dto.details,
      copyOf: cleanId(dto.copyOf),
      falsificationOf: cleanId(dto.falsificationOf),
      isActive: dto.isActive,
      isPrivate: dto.isPrivate,
      qrCode: dto.qrCode,
      images: dto.images,
      items: Array.isArray(dto.items) ? dto.items.filter(id => id && typeof id === 'string' && id.trim() !== "") : dto.items
    };
  }
}

module.exports = ArtworkMapper;
