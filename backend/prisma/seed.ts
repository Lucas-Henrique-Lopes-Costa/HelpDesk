import { PrismaClient, UserRole } from "@prisma/client";
import { hashService } from "../src/services/hash.service";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashService.hash("helpdesk123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@helpdesk.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@helpdesk.local",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // eslint-disable-next-line no-console
  console.log("[seed] Admin user ready:", admin.email);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
