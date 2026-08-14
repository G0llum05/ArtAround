class MuseumResponseDTO {
  constructor(id, name, description, address, contact, maxCapacity, actualCapacity, visits, artworks, openingHours, ticketInfo, isActive, services, accessibility, pointsOfInterest, floors, transportInfo, eventsAndExibitions, requirements) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.address = address;
    this.contact = contact;
    this.maxCapacity = maxCapacity;
    this.actualCapacity = actualCapacity;
    this.visits = visits;
    this.artworks = artworks;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
    this.isActive = isActive;
    this.services = services;
    this.accessibility = accessibility;
    this.pointsOfInterest = pointsOfInterest;
    this.floors = floors;
    this.transportInfo = transportInfo;
    this.eventsAndExibitions = eventsAndExibitions;
    this.requirements = requirements;
  }
}

class MuseumRequestDTO {
  constructor(name, description, address, contact, maxCapacity, actualCapacity, visits, artworks, openingHours, ticketInfo, isActive, services, accessibility, pointsOfInterest, floors, transportInfo, eventsAndExibitions, requirements) {
    this.name = name;
    this.description = description;
    this.address = address;
    this.contact = contact;
    this.maxCapacity = maxCapacity;
    this.actualCapacity = actualCapacity;
    this.visits = visits;
    this.artworks = artworks;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
    this.isActive = isActive;
    this.services = services;
    this.accessibility = accessibility;
    this.pointsOfInterest = pointsOfInterest;
    this.floors = floors;
    this.transportInfo = transportInfo;
    this.eventsAndExibitions = eventsAndExibitions;
    this.requirements = requirements;
  }
}

class MuseumVisitPlanResponseDTO {
  constructor(id, name, city, maxCapacity, actualCapacity, ticketInfo, imageUrls = []) {
    this.id = id;
    this.name = name;
    this.city = city;
    this.maxCapacity = maxCapacity;
    this.actualCapacity = actualCapacity;
    this.ticketInfo = ticketInfo;
    this.imageUrls = imageUrls;
  }
}

class MuseumHomePresentationResponseDTO {
  constructor(id, name, description, city, disableFriendly, assets) {
    this.id = id
    this.name = name;
    this.description = description;
    this.city = city;
    this.disableFriendly = disableFriendly;
    this.assets = assets;
  }
}

module.exports = {
  MuseumResponseDTO,
  MuseumRequestDTO,
  MuseumVisitPlanResponseDTO,
  MuseumHomePresentationResponseDTO
};
