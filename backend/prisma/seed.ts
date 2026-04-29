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
      where: { id: "11111111-1111-1111-1111-111111111111" },
      update: {},
      create: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Sala de Atendimento",
        building: "Prédio A",
        floor: "1º Andar",
      },
    }),
    prisma.location.upsert({
      where: { id: "22222222-2222-2222-2222-222222222222" },
      update: {},
      create: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Sala de TI",
        building: "Prédio B",
        floor: "2º Andar",
      },
    }),
    prisma.location.upsert({
      where: { id: "33333333-3333-3333-3333-333333333333" },
      update: {},
      create: {
        id: "33333333-3333-3333-3333-333333333333",
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
      where: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
      update: {},
      create: {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Manutenção",
        slaHours: 24,
      },
    }),
    prisma.category.upsert({
      where: { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
      update: {},
      create: {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Limpeza",
        slaHours: 4,
      },
    }),
    prisma.category.upsert({
      where: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" },
      update: {},
      create: {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
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
