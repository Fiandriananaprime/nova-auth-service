import type { Address } from "@Fiandriananaprime/nova_api_type";

export type UserClientResponse = {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
};

export class UserClient {
  constructor(private readonly baseUrl: string) {}

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
    });

    if (!response.ok) {
      throw new Error("Failed to create user");
    }

    return (await response.json()) as UserClientResponse;
  }

  async getUserAddresses(userId: string): Promise<{address:Address[]}> {
    const response = await fetch(`${this.baseUrl}/internal/addresses?userId=${userId}`)
    const result =await response.json() as {address : Address[]};

    if(!response.ok) throw new Error("failed to fetch Addresses for user" + userId)
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
        throw new Error("Failed to delete user");
    }
    }
}