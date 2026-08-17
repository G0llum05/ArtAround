class VisitResponseDTO {
  constructor(id, title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, categories = [], likesCount = 0, views = { total: 0, weekly: 0 }, assets = { images: [] }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.price = price;
    this.license = license;
    this.verified = verified;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
    this.startDate = startDate;
    this.endDate = endDate;
    this.active = active;
    this.weeklySchedule = weeklySchedule;
    this.disabledFriendly = disabledFriendly;
    this.requirements = requirements;
    this.categories = categories;
    this.likesCount = likesCount;
    this.views = views;
    this.assets = assets;
  }
}

class TopTenVisitsResponseDTO {
  constructor(id, title, description, isVerified, disableFriendly, duration, price, isClosingSoon, isNew, assets = { images: [] }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.isVerified = isVerified;
    this.disableFriendly = disableFriendly;
    this.duration = duration;
    this.price = price;
    this.isClosingSoon = isClosingSoon;
    this.isNew = isNew;
    this.assets = assets;
  }
}

class MuseumVisitForPresentationDTO {
  constructor(id, title, description, isVerified, disableFriendly, duration, price, isClosingSoon, isNew, categories = [], assets = { images: [] }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.isVerified = isVerified;
    this.disableFriendly = disableFriendly;
    this.duration = duration;
    this.price = price;
    this.isClosingSoon = isClosingSoon;
    this.isNew = isNew;
    this.categories = categories;
    this.assets = assets;
  }
}


class VisitRequestDTO {
  constructor(title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, categories = [], artworks = [], assets = { images: [] }) {
    this.title = title;
    this.description = description;
    this.price = price;
    this.license = license;
    this.verified = verified;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
    this.startDate = startDate;
    this.endDate = endDate;
    this.active = active;
    this.weeklySchedule = weeklySchedule;
    this.disabledFriendly = disabledFriendly;
    this.requirements = requirements;
    this.categories = categories;
    this.artworks = artworks;
    this.assets = assets;
  }
}

class VisitImageRequestDTO {
  constructor(museumId, visitId) {
    this.museumId = museumId;
    this.visitId = visitId;
  }
}

class VisitHomePresentationRequestDTO {
  constructor(museumId, visitId) {
    this.museumId = museumId;
    this.visitId = visitId;
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO,
  TopTenVisitsResponseDTO,
  MuseumVisitForPresentationDTO
};
