const { ArtworkResponseDTO, ArtworkForPresentationDTO, ArtworkRequestDTO, ArtworkLLMRequestDTO } = require('../model/dto/ArtworkDTO');

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
      artworkModel.assets || (artworkModel.images ? { images: artworkModel.images } : { images: [] }),
      artworkModel.items || artworkModel.defaultItems || []
    );
  }

  static toArtworkForPresentationDTO(artwork) {
    if (!artwork) return null;
    return new ArtworkForPresentationDTO(
      artwork._id,
      artwork.title,
      artwork.description,
      artwork.artists,
      artwork.assets
    )
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
      assets: dto.assets || (dto.images ? { images: dto.images } : { images: [] }),
      defaultItems: Array.isArray(dto.items) ? dto.items.filter(id => id && typeof id === 'string' && id.trim() !== "") : dto.items
    };
  }
  static toArtworkLLMRequestDTO(artworkModel) {
    if (!artworkModel) return null;

    const cleanArtists = Array.isArray(artworkModel.artists)
      ? artworkModel.artists.map(a => {
          if (typeof a === 'object' && a !== null) {
            return {
              name: a.name,
              surname: a.surname,
              artisticCurrents: a.artisticCurrents
            };
          }
          return a;
        })
      : artworkModel.artists;

    return new ArtworkLLMRequestDTO(
      artworkModel.title,
      artworkModel.description,
      artworkModel.startYear,
      artworkModel.endYear,
      cleanArtists,
      typeof artworkModel.museum === 'object' ? (artworkModel.museum.name || '') : artworkModel.museum,
      artworkModel.location,
      artworkModel.dimensions,
      artworkModel.artisticCurrents,
      artworkModel.details,
      artworkModel.copyOf,
      artworkModel.falsificationOf
    );
  }
}

module.exports = ArtworkMapper;
