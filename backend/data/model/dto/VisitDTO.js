class VisitResponseDTO {
  constructor(id, title, description, price, verified, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.price = price;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
    this.startDate = startDate;
    this.endDate = endDate;
    this.active = active;
    this.weeklySchedule = weeklySchedule;
    this.disabledFriendly = disabledFriendly;
    this.requirements = requirements;
  }
}

class VisitRequestDTO {
  constructor(title, description, price, minDuration, maxDuration, startDate, endDate, active, weeklySchedule, disabledFriendly, requirements) {
    this.title = title;
    this.description = description;
    this.price = price;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
    this.startDate = startDate;
    this.endDate = endDate;
    this.active = active;
    this.weeklySchedule = weeklySchedule;
    this.disabledFriendly = disabledFriendly;
    this.requirements = requirements;
  }
}

module.exports = {
  VisitResponseDTO,
  VisitRequestDTO,
};