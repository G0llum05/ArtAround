class MuseumResponseDTO {
  constructor(id, name, description, address, location, contact, maxCapacity, actualCapacity, visits, artworks, openingHours, ticketInfo, isActive, disableFriendly, requirements) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.address = address;
    this.location = location;
    this.contact = contact;
    this.maxCapacity = maxCapacity;
    this.actualCapacity = actualCapacity;
    this.visits = visits;
    this.artworks = artworks;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
    this.isActive = isActive;
    this.disableFriendly = disableFriendly;
    this.requirements = requirements;
  }
}

class MuseumRequestDTO {
  constructor(name, description, address, location, contact, maxCapacity, actualCapacity, visits, artworks, openingHours, ticketInfo, isActive, disableFriendly, requirements) {
    this.name = name;
    this.description = description;
    this.address = address;
    this.location = location;
    this.contact = contact;
    this.maxCapacity = maxCapacity;
    this.actualCapacity = actualCapacity;
    this.visits = visits;
    this.artworks = artworks;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
    this.isActive = isActive;
    this.disableFriendly = disableFriendly;
    this.requirements = requirements;
  }
}

module.exports = {
  MuseumResponseDTO,
  MuseumRequestDTO,
};
