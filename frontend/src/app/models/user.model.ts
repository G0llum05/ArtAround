export interface UserResponse {
    id: number,
    name: string,
    surname: string,
    mail: string,
    role: string
}

export interface UserRequest {
    name: string,
    surname: string,
    mail: string,
    password: string,
    role: string
}

export interface LoginRequest {
    mail: string,
    password: string
}