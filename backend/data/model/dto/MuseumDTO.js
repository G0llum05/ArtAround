class MuseumResponseDTO {
  constructor(id, name, description, address, location, contact, openingHours, ticketInfo) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.address = address;
    this.location = location;
    this.contact = contact;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
  }
}

class MuseumRequestDTO {
  constructor(name, description, address, location, contact, openingHours, ticketInfo) {
    this.name = name;
    this.description = description;
    this.address = address;
    this.location = location;
    this.contact = contact;
    this.openingHours = openingHours;
    this.ticketInfo = ticketInfo;
  }
}

module.exports = {
  MuseumResponseDTO,
  MuseumRequestDTO,
};
