const {
  GroupVisitResponseDTO,
  GroupVisitSummaryDTO
} = require('../model/dto/GroupVisitDTO');
const VisitMapper = require('./VisitMapper');

class GroupVisitMapper {
  static toGroupVisitResponseDTO(model) {
    if (!model) return null;

    const populatedVisit = model.visit && typeof model.visit === 'object' && model.visit.title
      ? VisitMapper.toVisitResponseDTO(model.visit)
      : model.visit;

    const teacherInfo = model.teacher && typeof model.teacher === 'object'
      ? {
          id: model.teacher._id ? model.teacher._id.toString() : model.teacher.id,
          name: `${model.teacher.name || ''} ${model.teacher.surname || ''}`.trim(),
          email: model.teacher.email
        }
      : { id: model.teacher ? model.teacher.toString() : null };

    const mappedParticipants = (model.participants || []).map(p => ({
      userId: p.user ? (p.user._id ? p.user._id.toString() : p.user.toString()) : null,
      name: p.name || (p.user && p.user.name ? `${p.user.name} ${p.user.surname || ''}`.trim() : 'Studente'),
      email: p.email || (p.user ? p.user.email : null),
      joinedAt: p.joinedAt,
      isOnline: p.isOnline,
      lastSeen: p.lastSeen
    }));

    const mappedQuestions = (model.questions || []).map(q => ({
      id: q._id ? q._id.toString() : q.id,
      studentId: q.student ? (q.student._id ? q.student._id.toString() : q.student.toString()) : null,
      studentName: q.studentName,
      text: q.text,
      stepIndex: q.stepIndex,
      status: q.status,
      createdAt: q.createdAt
    }));

    return new GroupVisitResponseDTO({
      id: model._id ? model._id.toString() : model.id,
      sessionCode: model.sessionCode,
      visit: populatedVisit,
      teacher: teacherInfo,
      title: model.title || (populatedVisit && populatedVisit.title ? `Visita: ${populatedVisit.title}` : 'Visita di Gruppo'),
      status: model.status,
      currentStepIndex: model.currentStepIndex || 0,
      activeItem: model.activeItem,
      settings: model.settings || { isLocked: true, allowQuestions: true },
      participants: mappedParticipants,
      questions: mappedQuestions,
      startedAt: model.startedAt,
      endedAt: model.endedAt,
      createdAt: model.createdAt
    });
  }

  static toGroupVisitSummaryDTO(model) {
    if (!model) return null;

    const visitTitle = model.visit && typeof model.visit === 'object' ? model.visit.title : 'Visita';
    const visitId = model.visit && typeof model.visit === 'object'
      ? (model.visit._id ? model.visit._id.toString() : model.visit.id)
      : (model.visit ? model.visit.toString() : null);

    const teacherName = model.teacher && typeof model.teacher === 'object'
      ? `${model.teacher.name || ''} ${model.teacher.surname || ''}`.trim()
      : 'Docente';

    return new GroupVisitSummaryDTO({
      id: model._id ? model._id.toString() : model.id,
      sessionCode: model.sessionCode,
      visitTitle: visitTitle,
      visitId: visitId,
      teacherName: teacherName,
      status: model.status,
      participantCount: Array.isArray(model.participants) ? model.participants.length : 0,
      currentStepIndex: model.currentStepIndex || 0,
      createdAt: model.createdAt
    });
  }
}

module.exports = GroupVisitMapper;
