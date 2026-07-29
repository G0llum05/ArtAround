class VisitResponseDTO {
  constructor(id, title, description, price, verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.price = price;
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
  }
}

class VisitRequestDTO {
  constructor(title, description, price, verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements, quiz) {
    this.title = title;
    this.description = description;
    this.price = price;
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
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
};