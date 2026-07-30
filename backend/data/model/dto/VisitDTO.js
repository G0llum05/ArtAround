class VisitResponseDTO {
  constructor(id, title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz, categories = [], likesCount = 0, views = { total: 0, weekly: 0 }) {
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
    this.quiz = quiz;
    this.categories = categories;
    this.likesCount = likesCount;
    this.views = views;
  }
}

class VisitRequestDTO {
  constructor(title, description, price, license = 'Standard', verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz, categories = []) {
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
    this.quiz = quiz;
    this.categories = categories;
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
};