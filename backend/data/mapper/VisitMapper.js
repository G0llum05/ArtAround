const {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO,
  TopTenVisitsResponseDTO,
  MuseumVisitForPresentationDTO,
  CreateVisitDTO
} = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
    if (!visit) return null;
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
      visit.visits
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

  static toTopTenVisitsResponse(visit) {
    if (!visit) return null;
    return new TopTenVisitsResponseDTO(
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

  static toMuseumVisitForPresentationDTO(visit) {
    if (!visit) return null;
    return new MuseumVisitForPresentationDTO(
      visit._id ? visit._id.toString() : visit.id,
      visit.title,
      visit.description,
      visit.isVerified,
      visit.disableFriendly,
      visit.maxDuration,
      visit.price,
      visit.isClosingSoon,
      visit.isNew,
      visit.categories || [],
      visit.assets || { images: [] }
    );
  }

  static createVisit(museumId, userId, visit) {
    if (!museumId || !userId || !visit) return null;
    return new CreateVisitDTO(museumId, userId, visit)
  }
}

module.exports = VisitMapper;
