class VisitResponseDTO {
  // constructor(id, title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz, categories = [], likesCount = 0, views = { total: 0, weekly: 0 }) {
  constructor(id, title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, categories = [], likesCount = 0, views = { total: 0, weekly: 0 }) {
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
    // this.quiz = quiz;
    this.categories = categories;
    this.likesCount = likesCount;
    this.views = views;
  }
}

class VisitRequestDTO {
  // constructor(title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz, categories = [], artworks = []) {
  constructor(title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, categories = [], artworks = []) {
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
    // this.quiz = quiz;
    this.categories = categories;
    this.artworks = artworks;
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

class VisitHomePresentationResponseDTO {
  constructor(id, title, description, verified, disableFriendly, duration, cost, imageUrls = []) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.verified = verified;
    this.disableFriendly = disableFriendly;
    this.imageUrls = imageUrls;
    this.duration = duration;
    this.cost = cost;
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
  VisitImageRequestDTO,
  VisitHomePresentationRequestDTO,
  VisitHomePresentationResponseDTO
};
