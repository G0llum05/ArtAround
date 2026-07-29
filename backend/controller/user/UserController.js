const UserService = require('../../service/UserService');
const UserMapper = require('../../data/mapper/UserMapper');
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
            const updatedUser = await UserService.updateUser(req.params.id, req.body);
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userResponseDTO = UserMapper.toUserResponseDTO(updatedUser);
            res.status(200).json(userResponseDTO);
        } catch (error) {
            res.status(400).json({ message: error.message });
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
