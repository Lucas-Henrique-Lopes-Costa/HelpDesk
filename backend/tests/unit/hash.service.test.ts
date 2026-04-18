import { hashService } from "../../src/services/hash.service";

describe("hashService", () => {
  it("gera um hash diferente do texto original", async () => {
    const hash = await hashService.hash("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("compare retorna true para a senha correta", async () => {
    const hash = await hashService.hash("secret123");
    await expect(hashService.compare("secret123", hash)).resolves.toBe(true);
  });

  it("compare retorna false para senha incorreta", async () => {
    const hash = await hashService.hash("secret123");
    await expect(hashService.compare("wrong", hash)).resolves.toBe(false);
  });

  it("rejeita senhas com menos de 6 caracteres", async () => {
    await expect(hashService.hash("12345")).rejects.toThrow(
      /at least 6 characters/,
    );
  });
});
