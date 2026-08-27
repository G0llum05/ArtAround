class GroupVisitResponseDTO {
  constructor({
    id,
    sessionCode,
    visit,
    teacher,
    title,
    status,
    currentStepIndex,
    activeItem,
    settings,
    participants = [],
    questions = [],
    startedAt,
    endedAt,
    createdAt
  }) {
    this.id = id;
    this.sessionCode = sessionCode;
    this.visit = visit;
    this.teacher = teacher;
    this.title = title;
    this.status = status;
    this.currentStepIndex = currentStepIndex;
    this.activeItem = activeItem;
    this.settings = settings;
    this.participants = participants;
    this.questions = questions;
    this.startedAt = startedAt;
    this.endedAt = endedAt;
    this.createdAt = createdAt;
  }
}

class GroupVisitCreateRequestDTO {
  constructor({ visitId, title, settings }) {
    this.visitId = visitId;
    this.title = title;
    this.settings = settings;
  }
}

class GroupVisitUpdateRequestDTO {
  constructor({ status, currentStepIndex, activeItem, settings }) {
    this.status = status;
    this.currentStepIndex = currentStepIndex;
    this.activeItem = activeItem;
    this.settings = settings;
  }
}

class GroupVisitSummaryDTO {
  constructor({
    id,
    sessionCode,
    visitTitle,
    visitId,
    teacherName,
    status,
    participantCount,
    currentStepIndex,
    createdAt
  }) {
    this.id = id;
    this.sessionCode = sessionCode;
    this.visitTitle = visitTitle;
    this.visitId = visitId;
    this.teacherName = teacherName;
    this.status = status;
    this.participantCount = participantCount;
    this.currentStepIndex = currentStepIndex;
    this.createdAt = createdAt;
  }
}

module.exports = {
  GroupVisitResponseDTO,
  GroupVisitCreateRequestDTO,
  GroupVisitUpdateRequestDTO,
  GroupVisitSummaryDTO
};
