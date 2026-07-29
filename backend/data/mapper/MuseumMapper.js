const { MuseumResponseDTO, MuseumRequestDTO } = require('../model/dto/MuseumDTO');

class MuseumMapper {
  static toMuseumResponseDTO(museum) {
    if (!museum) return null;
    return new MuseumResponseDTO(
      museum._id,
      museum.name,
      museum.description,
      museum.address,
      museum.location,
      museum.contact,
      museum.maxCapacity,
      museum.actualCapacity,
      museum.visits,
      museum.artworks,
      museum.openingHours,
      museum.ticketInfo,
      museum.isActive,
      museum.disableFriendly,
      museum.requirements
    );
  }

  static toMuseum(museumRequestDTO) {
    if (!museumRequestDTO) return null;
    return {
      name: museumRequestDTO.name,
      description: museumRequestDTO.description,
      address: museumRequestDTO.address,
      location: museumRequestDTO.location,
      contact: museumRequestDTO.contact,
      maxCapacity: museumRequestDTO.maxCapacity,
      actualCapacity: museumRequestDTO.actualCapacity,
      visits: museumRequestDTO.visits,
      artworks: museumRequestDTO.artworks,
      openingHours: museumRequestDTO.openingHours,
      ticketInfo: museumRequestDTO.ticketInfo,
      isActive: museumRequestDTO.isActive,
      disableFriendly: museumRequestDTO.disableFriendly,
      requirements: museumRequestDTO.requirements
    };
  }
}

module.exports = MuseumMapper;
