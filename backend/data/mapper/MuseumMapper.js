const { MuseumResponseDTO, MuseumRequestDTO, MuseumVisitPlanResponseDTO, MuseumHomePresentationResponseDTO } = require('../model/dto/MuseumDTO');

class MuseumMapper {
  static toMuseumResponseDTO(museum) {
    if (!museum) return null;
    return new MuseumResponseDTO(
      museum._id || museum.id,
      museum.name,
      museum.description,
      museum.address,
      museum.contact,
      museum.maxCapacity,
      museum.actualCapacity,
      museum.visits,
      museum.artworks,
      museum.openingHours,
      museum.ticketInfo,
      museum.isActive,
      museum.services,
      museum.accessibility,
      museum.pointsOfInterest,
      museum.floors,
      museum.transportInfo,
      museum.eventsAndExibitions || museum.eventsAndExhibitions,
      museum.requirements
    );
  }

  static toMuseumHomePresentationResponseDTO(museum) {
    if (!museum) return null;

    return new MuseumHomePresentationResponseDTO(
      museum._id,
      museum.name,
      museum.description,
      museum.address ? museum.address.city : null,
      museum.accessibility.disableFriendly,
      museum.assets
    )
  }

  static toMuseumVisitPlanResponseDTO(museum, imageUrls = []) {
    if (!museum) return null;
    return new MuseumVisitPlanResponseDTO(
      museum._id || museum.id,
      museum.name,
      museum.address ? museum.address.city : null,
      museum.maxCapacity,
      museum.actualCapacity,
      museum.ticketInfo,
      imageUrls
    );
  }


  static toMuseum(museumRequestDTO) {
    if (!museumRequestDTO) return null;
    return {
      name: museumRequestDTO.name,
      description: museumRequestDTO.description,
      address: museumRequestDTO.address,
      contact: museumRequestDTO.contact,
      maxCapacity: museumRequestDTO.maxCapacity,
      actualCapacity: museumRequestDTO.actualCapacity,
      visits: museumRequestDTO.visits,
      artworks: museumRequestDTO.artworks,
      openingHours: museumRequestDTO.openingHours,
      ticketInfo: museumRequestDTO.ticketInfo,
      isActive: museumRequestDTO.isActive,
      services: museumRequestDTO.services,
      accessibility: museumRequestDTO.accessibility,
      pointsOfInterest: museumRequestDTO.pointsOfInterest,
      floors: museumRequestDTO.floors,
      transportInfo: museumRequestDTO.transportInfo,
      eventsAndExhibitions: museumRequestDTO.eventsAndExibitions || museumRequestDTO.eventsAndExhibitions,
      requirements: museumRequestDTO.requirements
    };
  }


}

module.exports = MuseumMapper;
