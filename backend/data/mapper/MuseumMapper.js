const { MuseumResponseDTO, MuseumRequestDTO } = require('../model/dto/MuseumDTO');

class MuseumMapper {
  static toMuseumResponseDTO(museum) {
    return new MuseumResponseDTO(
      museum._id,
      museum.name,
      museum.description,
      museum.address,
      museum.location,
      museum.contact,
      museum.openingHours,
      museum.ticketInfo
    );
  }

  static toMuseum(museumRequestDTO) {
    return {
      name: museumRequestDTO.name,
      description: museumRequestDTO.description,
      address: museumRequestDTO.address,
      location: museumRequestDTO.location,
      contact: museumRequestDTO.contact,
      openingHours: museumRequestDTO.openingHours,
      ticketInfo: museumRequestDTO.ticketInfo
    };
  }
}

module.exports = MuseumMapper;
