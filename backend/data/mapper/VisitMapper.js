const {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitHomePresentationResponseDTO
} = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
    if (!visit) return null;
    return new VisitResponseDTO(
      visit._id ? visit._id.toString() : visit.id,
      visit.title,
      visit.description,
      visit.price,
      visit.license || 'Standard',
      visit.verified,
      visit.minDuration,
      visit.maxDuration,
      visit.startDate,
      visit.endDate,
      visit.active,
      visit.weeklySchedule,
      visit.disableFriendly,
      visit.requirements,
      visit.quiz,
      visit.categories || [],
      visit.likesCount || 0,
      visit.views || { total: 0, weekly: 0 }
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
      artworks: visitRequestDTO.artworks || []
    };
  }

  static toSingleVisitHomePresentationRes(visit, imageUrls, badge = '') {
    if (!visit) return null;
    return new VisitHomePresentationResponseDTO(
      visit._id ? visit._id.toString() : visit.id,
      visit.title,
      visit.description,
      visit.verified,
      visit.disableFriendly,
      visit.maxDuration,
      visit.price,
      badge,
      imageUrls,
    );
  }

  static toVisitHomePresentationList(visits, imageUrlsList = [], badges = []) {
    if (!visits || !Array.isArray(visits)) return [];
    return visits.map((visit, index) => {
      const urls = imageUrlsList[index] || [];
      const badge = badges[index] || '';
      return VisitMapper.toSingleVisitHomePresentationRes(visit, urls, badge);
    });
  }

}

module.exports = VisitMapper;
