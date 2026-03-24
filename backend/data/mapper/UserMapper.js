const { UserResponseDTO, UserRequestDTO } = require('../model/dto/UserDTO');

class UserMapper {
    static toUserResponseDTO(userModel) {
        return new UserResponseDTO(userModel._id, userModel.name, userModel.surname, userModel.email, userModel.role);
    }

    static toUserModel(userRequestDTO) {
        return {
            name: userRequestDTO.name,
            surname: userRequestDTO.surname,
            email: userRequestDTO.email,
            password: userRequestDTO.password,
            role: userRequestDTO.role
        }
    }
}

module.exports = UserMapper;
