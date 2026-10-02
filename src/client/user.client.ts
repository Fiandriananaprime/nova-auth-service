import type { Address } from "@Fiandriananaprime/nova_api_type";
import {
  ExternalServiceError,
  UpstreamServiceError,
} from "../errorHandler/AppError.js";

export type UserClientResponse = {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
};

export class UserClient {
  constructor(private readonly baseUrl: string) {}

  private async throwResponseError(
    response: Response,
    operation: string,
  ): Promise<never> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (
      response.status < 500 &&
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null
    ) {
      const error = body.error as { code?: unknown; message?: unknown };
      throw new UpstreamServiceError(
        response.status,
        typeof error.code === "string" ? error.code : "UPSTREAM_REQUEST_ERROR",
        typeof error.message === "string"
          ? error.message
          : `User service rejected the request while ${operation}`,
      );
    }

    throw new ExternalServiceError("user", operation);
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<UserClientResponse> {
    const response = await fetch(`${this.baseUrl}/internal/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      await this.throwResponseError(response, "creating the user");
    }

    return (await response.json()) as UserClientResponse;
  }

  async getUserAddresses(userId: string): Promise<{address:Address[]}> {
    const response = await fetch(`${this.baseUrl}/internal/addresses?userId=${userId}`)
    const result =await response.json() as {address : Address[]};

    if(!response.ok) {
      await this.throwResponseError(response, "fetching addresses");
    }
    return result
  }
  
  async deleteUser(id: string): Promise<void> {
    const response = await fetch(
        `${this.baseUrl}/internal/users/${id}`,
        {
        method: "DELETE",
        },
    );

    if (!response.ok) {
        await this.throwResponseError(response, "rolling back user creation");
    }
    }
}