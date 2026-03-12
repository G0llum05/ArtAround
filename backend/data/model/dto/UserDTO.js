class UserResponseDTO {
    constructor(id, name, surname, mail, role) {
        this.id = id;
        this.name =  name;
        this.surname = surname;
        this.mail =  mail;
        this.role = role;
    }
}
// crezione  e update letsgoski :)
class UserRequestDTO {
    constructor(name, surname, mail, password, role) {
        this.name =  name;
        this.surname = surname;
        this.mail =  mail;
        this.password = password;
        this.role = role;
    }
}

class LoginRequestDTO {
    constructor(mail, password) {
        this.mail = mail;
        this.password = password;
    }
}
module.exports = {
    UserResponseDTO,
    UserRequestDTO,
    LoginRequestDTO
}