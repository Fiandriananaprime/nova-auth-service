import argon2 from "argon2";
import  { UserRepository } from "../repository/user.repository.js";
import { VerificationCodeRepository } from "../repository/verificationCode.repository.js";
import { InvalidCredentialsError } from "../errorHandler/InvalidCredentialError.js";
import { EmailNotVerifiedError, ExpiredVerificationCode, InvalidVerficationCode, VerificationNotFound } from "../errorHandler/EmailNotVerified.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationRepository: VerificationCodeRepository
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

  async VerifyEmail(id:string,code:string){
    const verificationCode = await this.verificationRepository.findById(id);

    if(!verificationCode) throw new VerificationNotFound();
    if (verificationCode.expiresAt < new Date())throw new ExpiredVerificationCode();
    const valid = await argon2.verify( verificationCode.codeHash,code);
    if(!valid) throw new InvalidVerficationCode();
  }
}