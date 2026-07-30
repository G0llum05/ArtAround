const { VisitResponseDTO, VisitRequestDTO } = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
    if (!visit) return null;
    return new VisitResponseDTO(
      visit._id,
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
      visit.disabledFriendly,
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
      disabledFriendly: visitRequestDTO.disabledFriendly,
      requirements: visitRequestDTO.requirements,
      quiz: visitRequestDTO.quiz,
      categories: visitRequestDTO.categories || []
    };
  }
}

module.exports = VisitMapper;
