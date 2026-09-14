const UserService = require('../../service/UserService');
const UserMapper = require('../../data/mapper/UserMapper');
const VisitMapper = require('../../data/mapper/VisitMapper');
const VisitService = require('../../service/VisitService');
const { UserRequestDTO } = require('../../data/model/dto/UserDTO');

class UserController {
    static async getAllUsers(req, res) {
        try {
            const users = await UserService.getAllUsers();
            const userDTOs = users.map(user => UserMapper.toUserResponseDTO(user));
            res.status(200).json(userDTOs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getUserById(req, res) {
        try {
            const user = await UserService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userResponseDTO = UserMapper.toUserResponseDTO(user);
            res.status(200).json(userResponseDTO);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getPurchasedVisitsById(req, res) {
        try {
            const userId = req.params.id;
            const user = await UserService.getPurchasedVisits(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const visits = (user.purchasedVisits || []).filter(Boolean);
            res.status(200).json(visits.map(visit => VisitMapper.toVisitResponsePresentation(visit)));
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getCreatedVisitsById(req, res) {
        try {
            const userId = req.params.id;
            const visits = await VisitService.getVisitsByCreator(userId);
            res.status(200).json(visits.map(visit => VisitMapper.toVisitResponsePresentation(visit)));
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async createUser(req, res) {
        try {
            const userRequestDTO = new UserRequestDTO(
                req.body.name,
                req.body.surname,
                req.body.email,
                req.body.password,
                req.body.role,
                req.body.preferences
            );
            const newUser = await UserService.createUser(userRequestDTO);
            const userResponseDTO = UserMapper.toUserResponseDTO(newUser);
            res.status(201).json(userResponseDTO);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async updateUser(req, res) {
        try {
            const updatePayload = {};
            if (req.body.name !== undefined) {
                const name = String(req.body.name).trim();
                if (!name) return res.status(400).json({ message: 'Il nome non può essere vuoto' });
                updatePayload.name = name;
            }
            if (req.body.surname !== undefined) {
                const surname = String(req.body.surname).trim();
                if (!surname) return res.status(400).json({ message: 'Il cognome non può essere vuoto' });
                updatePayload.surname = surname;
            }
            if (req.body.gender !== undefined) {
                if (!['m', 'f', 'other'].includes(req.body.gender)) {
                    return res.status(400).json({ message: 'Genere non valido' });
                }
                updatePayload.gender = req.body.gender;
            }
            if (req.body.preferences !== undefined) {
                updatePayload.preferences = req.body.preferences;
            }

            const updatedUser = await UserService.updateUser(req.params.id, updatePayload);
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userResponseDTO = UserMapper.toUserResponseDTO(updatedUser);
            res.status(200).json({
                ...userResponseDTO,
                userId: updatedUser._id.toString()
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async purchaseVisit(req, res) {
        try {
            const userId = req.params.id || req.body.userId;
            const { visitId } = req.body;
            if (!userId || !visitId) {
                return res.status(400).json({ message: 'UserId e visitId sono obbligatori' });
            }
            const updatedUser = await UserService.purchaseVisit(userId, visitId);
            if (!updatedUser) {
                return res.status(404).json({ message: 'User non trovato' });
            }
            const userResponseDTO = UserMapper.toUserResponseDTO(updatedUser);
            res.status(200).json({
                message: 'Visita acquistata con successo',
                user: userResponseDTO
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteUser(req, res) {
        try {
            const deletedUser = await UserService.deleteUser(req.params.id);
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = UserController;
