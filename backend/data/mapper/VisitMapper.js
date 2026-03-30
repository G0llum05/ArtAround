const { VisitResponseDTO, VisitRequestDTO } = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
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
      visit.requirements
    );
  }

  static toVisit(visitRequestDTO) {
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
      requirements: visitRequestDTO.requirements
    };
  }
}

module.exports = VisitMapper;
