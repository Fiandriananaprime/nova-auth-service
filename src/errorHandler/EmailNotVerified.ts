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

export class VerificationNotFound extends AppError {
  constructor() {
    super(
      "VERIFICATION_CODE_NOTFOUND",
      404,
      "Verification code not found",
    );
  }
}

export class InvalidVerificationCode extends AppError {
  constructor(){
   super( "INVALID_VERIFICATION_CODE",
    400,
    "Invalid verification code")
  }
}

export class ExpiredVerificationCode extends AppError {
  constructor(){
    super(
      "VERIFICATION_CODE_EXPIRED",
      400,
    "Verification code expired",
    )
  }
}

export class VerificationRateLimitError extends AppError {
  constructor() {
    super(
      "VERIFICATION_RATE_LIMITED",
      429,
      "Please wait before requesting another verification code",
    );
  }
}