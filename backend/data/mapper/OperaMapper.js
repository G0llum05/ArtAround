const { OperaResponseDTO, OperaRequestDTO } = require('../model/dto/OperaDTO');

class OperaMapper {
  static toOperaResponseDTO(operaModel) {
    if (!operaModel) return null;
    return new OperaResponseDTO(
      operaModel._id,
      operaModel.title,
      operaModel.description,
      operaModel.startYear,
      operaModel.endYear,
      operaModel.makers,
      operaModel.museum,
      operaModel.location,
      operaModel.dimensions,
      operaModel.artisticCurrents,
      operaModel.details,
      operaModel.copyOf,
      operaModel.falsificationOf
    );
  }

  static toOperaModel(dto) {
    if (!dto) return null;

    // Funzione di utilità per pulire gli ID: se è una stringa vuota, diventa undefined
    const cleanId = (id) => (id && id.trim() !== "") ? id : undefined;

    return {
      title: dto.title,
      description: dto.description,
      startYear: dto.startYear,
      endYear: dto.endYear,
      // Puliamo gli ID nell'array makers
      makers: Array.isArray(dto.makers) ? dto.makers.filter(id => id && id.trim() !== "") : [],
      museum: cleanId(dto.museum),
      location: dto.location,
      dimensions: dto.dimensions,
      artisticCurrents: dto.artisticCurrents,
      details: dto.details,
      copyOf: cleanId(dto.copyOf),
      falsificationOf: cleanId(dto.falsificationOf)
    };
  }
}

module.exports = OperaMapper;
