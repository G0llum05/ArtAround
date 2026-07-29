const { VisitResponseDTO, VisitRequestDTO } = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
    if (!visit) return null;
    return new VisitResponseDTO(
      visit._id,
      visit.title,
      visit.description,
      visit.price,
      visit.verified,
      visit.minDuration,
      visit.maxDuration,
      visit.startDate,
      visit.endDate,
      visit.active,
      visit.weeklySchedule,
      visit.disabledFriendly,
      visit.requirements,
      visit.quiz
    );
  }

  static toVisit(visitRequestDTO) {
    if (!visitRequestDTO) return null;
    return {
      title: visitRequestDTO.title,
      description: visitRequestDTO.description,
      price: visitRequestDTO.price,
      verified: visitRequestDTO.verified,
      minDuration: visitRequestDTO.minDuration,
      maxDuration: visitRequestDTO.maxDuration,
      startDate: visitRequestDTO.startDate,
      endDate: visitRequestDTO.endDate,
      active: visitRequestDTO.active,
      weeklySchedule: visitRequestDTO.weeklySchedule,
      disabledFriendly: visitRequestDTO.disabledFriendly,
      requirements: visitRequestDTO.requirements,
      quiz: visitRequestDTO.quiz
    };
  }
}

module.exports = VisitMapper;
