import { UserClient } from "./user.client.js";
import { env } from "../config/env.js";

export const InitiateClient = () => {
   const userApiService = new UserClient(env.USER_SERVICE)
   return userApiService
}