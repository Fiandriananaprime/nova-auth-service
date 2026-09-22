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

export class InvalidPasswordError extends AppError {
  constructor() {
    super(
      "INVALID_PASSWORD",
      401,
      "Invalid password",
    );
  }}

export class LowStrengthPasswordError extends AppError {
  constructor() {
    super(
      "LOW_STRENGTH_PASSWORD",
      400,
      "Password does not meet strength requirements",
    );
  }}