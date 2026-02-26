class VisitResponseDTO {
  constructor(id, title, description) {
    this.id = id;
    this.title = title;
    this.description = description;
  }
}

class VisitRequestDTO {
  constructor(title, description) {
    this.title = title;
    this.description = description;
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
};