import { AppError } from "./AppError.js";

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super(
      "EMAIL_NOT_VERIFIED",
      403,
      "Email address is not verified",
    );
  }
}