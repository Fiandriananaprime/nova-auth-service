import { AppError } from "./AppError.js";

export class UserNotFoundError extends AppError {
    constructor () {
        super (
            "USER_NOT_FOUND",
            404,
            "User not found"
        )
    }
}

export class UserAlreadyExists extends AppError {
    constructor () {
        super("USER_ALREADY_EXISTS",
        409,
        "User already exists")
    }
}