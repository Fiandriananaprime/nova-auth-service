export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, operation: string) {
    super(
      "DEPENDENCY_UNAVAILABLE",
      503,
      `${service} service is unavailable while ${operation}`,
    );
  }
}

export class UpstreamServiceError extends AppError {
  constructor(
    statusCode: number,
    code: string,
    message: string,
  ) {
    super(code, statusCode, message);
  }
}