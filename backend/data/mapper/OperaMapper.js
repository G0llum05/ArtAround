const { OperaResponseDTO, OperaPlaceResponseDTO, OperaMakerResponseDTO, OperaRequestDTO } = require('../model/dto/OperaDTO');

class OperaMapper {
  static toOperaResponseDTO(operaModel) {
    return new OperaResponseDTO(operaModel._id, operaModel.title, operaModel.maker, operaModel.place);
  }
  
  static toOperaPlaceResponseDTO(operaModel) {
    return new OperaPlaceResponseDTO(operaModel._id, operaModel.title, operaModel.place);
  }

  static toOperaMakerResponseDTO(operaModel) {
    return new OperaMakerResponseDTO(operaModel._id, operaModel.title, operaModel.maker);
  }

  static toOperaModel(operaRequestDTO) {
    return {
      title: operaRequestDTO.title,
      maker: operaRequestDTO.maker,
      place: operaRequestDTO.place,
    };
  }
}

module.exports = OperaMapper;
