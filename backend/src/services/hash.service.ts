import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashService = {
  async hash(plain: string): Promise<string> {
    if (!plain || plain.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    return bcrypt.hash(plain, SALT_ROUNDS);
  },

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },
};
