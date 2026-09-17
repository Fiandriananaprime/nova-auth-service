import { AppError } from "./AppError.js";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(
      "INVALID_CREDENTIALS",
      401,
      "Invalid email or password",
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message:string){
    super(
      "USER_UNAUTHORIZED",
      401,
      message?? "User unauthorized"
    );
  }
}