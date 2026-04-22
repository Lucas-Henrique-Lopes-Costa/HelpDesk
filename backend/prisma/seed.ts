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

  // Create Locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: "loc-001" },
      update: {},
      create: {
        id: "loc-001",
        name: "Sala de Atendimento",
        building: "Prédio A",
        floor: "1º Andar",
      },
    }),
    prisma.location.upsert({
      where: { id: "loc-002" },
      update: {},
      create: {
        id: "loc-002",
        name: "Sala de TI",
        building: "Prédio B",
        floor: "2º Andar",
      },
    }),
    prisma.location.upsert({
      where: { id: "loc-003" },
      update: {},
      create: {
        id: "loc-003",
        name: "Almoxarifado",
        building: "Prédio C",
        floor: "Térreo",
      },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log("[seed] Locations created:", locations.length);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-001" },
      update: {},
      create: {
        id: "cat-001",
        name: "Manutenção",
        slaHours: 24,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-002" },
      update: {},
      create: {
        id: "cat-002",
        name: "Limpeza",
        slaHours: 4,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-003" },
      update: {},
      create: {
        id: "cat-003",
        name: "Insumos",
        slaHours: 48,
      },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log("[seed] Categories created:", categories.length);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
