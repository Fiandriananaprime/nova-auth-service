import { AppError } from "./AppError.js";

export class UserNotFoundError extends AppError {
    constructor (message?: string) {
        super (
            "USER_NOT_FOUND",
            404,
            message || "User not found"
        )
    }
}

export class UserAlreadyExists extends AppError {
    constructor (message?: string) {
        super("USER_ALREADY_EXISTS",
        409,
        message || "User already exists")
    }
}