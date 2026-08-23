class VisitResponseDTO {
  constructor(id, title, description, price, license, creator, minDuration, maxDuration, isVerified, startDate, endDate, isActive, weeklySchedule, disabledFriendly, requirements, categories = [], likesCount = 0, views = { total: 0, weekly: 0 }, assets = { images: [] }, artworkNames = [], visits = [], museumName = null) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.price = price;
    this.license = license;
    this.creator = creator;
    this.visits = visits;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
    this.isActive = isActive;
    this.startDate = startDate;
    this.endDate = endDate;
    this.weeklySchedule = weeklySchedule;
    this.disabledFriendly = disabledFriendly;
    this.isVerified = isVerified;
    this.requirements = requirements;
    this.categories = categories;
    this.likesCount = likesCount;
    this.views = views;
    this.artworkNames = artworkNames;
    this.assets = assets;
    this.museumName = museumName;
    this.museumId = museumName;
  }
}

class VisitPresentationDTO {
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

class SingleStepNewVisitRequestDTO {
  constructor(artworkId, itemId, description, tellMeMore, length, language) {
    this.artworkId = artworkId;
    this.itemId = itemId || null;
    this.description = description || null;
    this.tellMeMore = tellMeMore || null;
    this.length = length || null;
    this.language = language || null;
  }
}

class CreateVisitDTO {
  constructor(museumId, userId, visit = {}) {
    this.museumId = museumId;
    this.userId = userId
    this.title = visit.title;
    this.description = visit.description
    this.assets = visit.assets
    this.price = visit.price
    this.isDisableFriendly = visit.isDisableFriendly
    this.license = visit.license
    this.duration = visit.duration
    this.visit = visit.visit.map(step => new SingleStepNewVisitRequestDTO(step.artworkId, step.itemId, step.description, step.tellMeMore, step.length, step.language))
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO,
  VisitPresentationDTO,
  CreateVisitDTO
};
