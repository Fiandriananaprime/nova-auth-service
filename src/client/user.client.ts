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