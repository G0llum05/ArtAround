const RoleManagementService = require('../../service/RoleManagementService');

// TODO CHECK TUTTO IL FILE

class RoleController {
  /**
   * POST /api/role/assign-student
   * Pre-assegna un'email al ruolo 'student'.
   * Può essere richiamato da: Teacher, MuseumStaff, Admin.
   */
  async assignStudent(req, res) {
    try {
      const { email, organization } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'L\'indirizzo email dello studente è obbligatorio.' });
      }

      const assignment = await RoleManagementService.assignStudentByEmail(
        email,
        req.user.id,
        organization || ''
      );

      res.status(201).json({
        message: `L'email '${email}' è stata registrata come studente. Quando l'utente effettuerà l'accesso con questa email otterrà automaticamente il ruolo 'student'.`,
        assignment: assignment
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /api/role/pending-requests
   * Restituisce tutte le richieste di cambio ruolo in attesa di approvazione.
   * Riservato agli Admin.
   */
  async getPendingRequests(req, res) {
    try {
      const pendingUsers = await RoleManagementService.getPendingRoleRequests();
      res.status(200).json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/role/approve/:userId
   * Approva la richiesta di cambio ruolo di un utente.
   * Riservato agli Admin.
   */
  async approveRequest(req, res) {
    try {
      const { userId } = req.params;
      const updatedUser = await RoleManagementService.approveRoleUpgrade(userId);
      res.status(200).json({
        message: `Richiesta approvata con successo. L'utente ora possiede il ruolo '${updatedUser.role}'.`,
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /api/role/reject/:userId
   * Rifiuta la richiesta di cambio ruolo di un utente.
   * Riservato agli Admin.
   */
  async rejectRequest(req, res) {
    try {
      const { userId } = req.params;
      const updatedUser = await RoleManagementService.rejectRoleUpgrade(userId);
      res.status(200).json({
        message: 'Richiesta di cambio ruolo rifiutata.',
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new RoleController();
