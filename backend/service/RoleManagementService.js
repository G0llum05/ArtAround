const StudentAssignment = require('../data/model/StudentAssignment');
const User = require('../data/model/User');
const { isAdminEmail } = require('../config/adminRegistry');

class RoleManagementService {
  /**
   * Pre-assegna l'email di uno studente. Eseguibile da Teacher, MuseumStaff o Admin.
   */
  async assignStudentByEmail(email, assignedByUserId, organization = '') {
    const cleanEmail = email.toLowerCase().trim();

    let existingAssignment = await StudentAssignment.findOne({ email: cleanEmail });
    if (!existingAssignment) {
      existingAssignment = new StudentAssignment({
        email: cleanEmail,
        assignedBy: assignedByUserId,
        organization: organization
      });
      await existingAssignment.save();
    }

    // Se l'utente si è già registrato prima dell'assegnazione, aggiorniamo il suo ruolo in 'student'
    const user = await User.findOne({ email: cleanEmail });
    if (user && user.role !== 'admin') {
      user.role = 'student';
      user.roleStatus = 'approved';
      user.requestedRole = null;
      await user.save();
      existingAssignment.isClaimed = true;
      await existingAssignment.save();
    }

    return existingAssignment;
  }

  /**
   * Determina il ruolo iniziale di un utente all'atto della registrazione o del login.
   * Regole:
   * 1. Se l'email è tra i 3 creatori admin -> ruolo 'admin', status 'approved'
   * 2. Se l'email è presente tra le StudentAssignment -> ruolo 'student', status 'approved'
   * 3. Se l'utente richiede 'teacher' o 'museumstaff' -> ruolo 'guest', requestedRole '<richiesto>', status 'pending'
   * 4. Di default -> ruolo 'guest', status 'approved'
   */
  async determineUserRoleOnSignup(email, requestedRoleInput) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Admin Registry
    if (isAdminEmail(cleanEmail)) {
      return { role: 'admin', roleStatus: 'approved', requestedRole: null };
    }

    // 2. Check Student Pre-assignment
    const studentAssignment = await StudentAssignment.findOne({ email: cleanEmail });
    if (studentAssignment) {
      studentAssignment.isClaimed = true;
      await studentAssignment.save();
      return { role: 'student', roleStatus: 'approved', requestedRole: null };
    }

    // 3. Check requested upgrade roles ('teacher' or 'museumstaff')
    if (requestedRoleInput === 'teacher' || requestedRoleInput === 'museumstaff') {
      return { role: 'guest', roleStatus: 'pending', requestedRole: requestedRoleInput };
    }

    // 4. Fallback Default
    return { role: 'guest', roleStatus: 'approved', requestedRole: null };
  }

  /**
   * Un utente con ruolo 'guest' richiede di diventare 'teacher' o 'museumstaff'.
   */
  async requestRoleUpgrade(userId, targetRole) {
    if (targetRole !== 'teacher' && targetRole !== 'museumstaff') {
      throw new Error('Ruolo richiesto non valido. Ruoli richiedibili: teacher, museumstaff.');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('Utente non trovato.');

    if (user.role === 'admin') {
      throw new Error('L\'amministratore possiede già i permessi massimi.');
    }

    user.requestedRole = targetRole;
    user.roleStatus = 'pending';
    await user.save();
    return user;
  }

  /**
   * L'Amministratore approva una richiesta di cambio ruolo in sospeso.
   */
  async approveRoleUpgrade(targetUserId) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('Utente non trovato.');
    if (user.roleStatus !== 'pending' || !user.requestedRole) {
      throw new Error('Nessuna richiesta di ruolo in sospeso per questo utente.');
    }

    user.role = user.requestedRole;
    user.roleStatus = 'approved';
    user.requestedRole = null;
    await user.save();
    return user;
  }

  /**
   * L'Amministratore rifiuta una richiesta di cambio ruolo.
   */
  async rejectRoleUpgrade(targetUserId) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('Utente non trovato.');

    user.roleStatus = 'approved';
    user.requestedRole = null;
    await user.save();
    return user;
  }

  /**
   * Recupera la lista delle richieste di ruolo in attesa di approvazione per gli Admin.
   */
  async getPendingRoleRequests() {
    return await User.find({ roleStatus: 'pending', requestedRole: { $ne: null } })
      .select('-password')
      .lean();
  }
}

module.exports = new RoleManagementService();
