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