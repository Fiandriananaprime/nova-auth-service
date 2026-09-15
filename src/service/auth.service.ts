import argon2 from "argon2";
import type { UserRepository } from "../repository/user.repository.js";
import { InvalidCredentialsError } from "../errorHandler/InvalidCredentialError.js";
import { EmailNotVerifiedError } from "../errorHandler/EmailNotVerified.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async login(data: {
    email: string;
    password: string;
  }) {
    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await argon2.verify(
      user.password,
      data.password
    );

    if (!validPassword) {
      throw new InvalidCredentialsError();
    } 


    if(!user.emailVerified) throw new EmailNotVerifiedError();
    
    const { password, ...safeUser } = user;

    return safeUser;
  }
}