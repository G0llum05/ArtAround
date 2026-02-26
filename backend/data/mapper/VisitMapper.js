const { VisitResponseDTO, VisitRequestDTO } = require('../model/dto/VisitDTO');

class VisitMapper {
  static toVisitResponseDTO(visit) {
    return new VisitResponseDTO(visit._id, visit.title, visit.description);
  }

  static toVisit(visitRequestDTO) {
    return {
      title: visitRequestDTO.title,
      description: visitRequestDTO.description,
    };
  }
}

module.exports = VisitMapper;
