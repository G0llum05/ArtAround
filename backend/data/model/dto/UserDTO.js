class UserResponseDTO {
    constructor(id, name, surname, mail, role) {
        this.id = id;
        this.name =  name;
        this.surname = surname;
        this.mail =  mail;
        this.role = role;
    }
}

class UserRequestDTO {
    constructor(name, surname, mail, password, role) {
        this.name =  name;
        this.surname = surname;
        this.mail =  mail;
        this.password = password;
        this.role = role;
    }
}

module.exports = {
    UserResponseDTO,
    UserRequestDTO
}