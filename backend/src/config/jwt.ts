import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "./env";

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export const jwtService = {
  sign(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    return jwt.sign(payload, env.JWT_SECRET, options);
  },

  verify(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  },
};
