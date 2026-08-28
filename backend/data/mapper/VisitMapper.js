const {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO,
  VisitPresentationDTO,
  CreateVisitDTO
} = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit, museum = null) {
    if (!visit) return null;

    const rawSteps = visit.steps || visit.visits || [];

    const mappedSteps = rawSteps.map(v => {
      const isPopulated = v.artwork && typeof v.artwork === 'object';
      const artworkId = isPopulated ? (v.artwork._id ? v.artwork._id.toString() : v.artwork.id) : (v.artwork ? v.artwork.toString() : null);
      const artworkTitle = isPopulated ? (v.artwork.title || 'Opera') : (typeof v.artwork === 'string' ? v.artwork : 'Opera');

      return {
        _id: v._id ? v._id.toString() : undefined,
        artworkId: artworkId,
        artworkTitle: artworkTitle,
        artwork: isPopulated ? v.artwork : artworkTitle, // Permette l'accesso sia con .artwork sia con .artworkTitle
        items: v.items || [],
        tellMeMore: v.tellMeMore || null
      };
    });

    const artworkNames = mappedSteps.map(v => v.artworkTitle).filter(Boolean);
    const museumName = museum ? (museum.name || museum) : (visit.museumName || null);
    const museumId = museum ? (museum._id ? museum._id.toString() : museum.id) : (visit.museumId || null);

    return new VisitResponseDTO(
      visit._id ? visit._id.toString() : visit.id,
      visit.title,
      visit.description,
      visit.price,
      visit.license,
      visit.creator,
      visit.minDuration,
      visit.maxDuration,
      visit.isVerified,
      visit.startDate,
      visit.endDate,
      visit.isActive,
      visit.weeklySchedule,
      visit.disableFriendly,
      visit.requirements,
      visit.categories || [],
      visit.likesCount || 0,
      visit.views || { total: 0, weekly: 0 },
      visit.assets || { images: [] },
      artworkNames,
      mappedSteps,
      museumName,
      museumId
    );
  }

  static toVisit(visitRequestDTO) {
    if (!visitRequestDTO) return null;
    return {
      title: visitRequestDTO.title,
      description: visitRequestDTO.description,
      price: visitRequestDTO.price,
      license: visitRequestDTO.license || 'Standard',
      verified: visitRequestDTO.verified,
      minDuration: visitRequestDTO.minDuration,
      maxDuration: visitRequestDTO.maxDuration,
      startDate: visitRequestDTO.startDate,
      endDate: visitRequestDTO.endDate,
      active: visitRequestDTO.active,
      weeklySchedule: visitRequestDTO.weeklySchedule,
      disableFriendly: visitRequestDTO.disableFriendly,
      requirements: visitRequestDTO.requirements,
      quiz: visitRequestDTO.quiz,
      categories: visitRequestDTO.categories || [],
      artworks: visitRequestDTO.artworks || [],
      assets: visitRequestDTO.assets || { images: [] }
    };
  }

  //TODO ho aggiornato il dto/mapper
  static toVisitResponsePresentation(visit) {
    if (!visit) return null;
    return new VisitPresentationDTO(
      visit._id ? visit._id.toString() : visit.id,
      visit.title,
      visit.description,
      visit.isVerified,
      visit.disableFriendly,
      visit.maxDuration,
      visit.price,
      visit.isClosingSoon,
      visit.isNew,
      visit.assets || { images: [] }
    );
  }

  static createVisit(museumId, userId, visit) {
    if (!museumId || !visit) return null;
    return new CreateVisitDTO(museumId, userId, visit);
  }
}

module.exports = VisitMapper;
