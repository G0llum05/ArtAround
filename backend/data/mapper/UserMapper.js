const { UserResponseDTO, UserRequestDTO } = require('../model/dto/UserDTO');

class UserMapper {
    static toUserResponseDTO(userModel) {
        return new UserResponseDTO(userModel._id, userModel.name, userModel.surname, userModel.mail, userModel.role);
    }

    static toUserModel(userRequestDTO) {
        return {
            name: userRequestDTO.name,
            surname: userRequestDTO.surname,
            mail: userRequestDTO.mail,
            password: userRequestDTO.password,
            role: userRequestDTO.role
        }
    }
}

module.exports = UserMapper;