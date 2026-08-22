/**
 * Seed mínimo A&D Licorería & Bodegón.
 * Idempotente: tenant, depósitos, admin, métodos de pago y categorías base.
 * NO crea productos, clientes ni operadores demo (usar cleanup:ad-demo para borrar datos viejos).
 *
 * Uso:
 *   cd apps/api && npx tsx prisma/seed-ad-licoreria.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { hashPassword } from "../src/ad/password.js";

const prisma = new PrismaClient();

/** Contraseña del operador admin inicial. */
const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";

async function main() {
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const tenant = await prisma.adTenant.upsert({
    where: { slug: "ad-licoreria" },
    update: {
      name: "A&D Licorería & Bodegón",
      active: true,
      timezone: "America/Caracas",
    },
    create: {
      projectId: randomUUID(),
      name: "A&D Licorería & Bodegón",
      slug: "ad-licoreria",
      timezone: "America/Caracas",
      active: true,
    },
  });

  const whLic = await prisma.adWarehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "LIC" } },
    update: { name: "Licorería", active: true },
    create: { tenantId: tenant.id, code: "LIC", name: "Licorería" },
  });
  const whBod = await prisma.adWarehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "BOD" } },
    update: { name: "Bodegón", active: true },
    create: { tenantId: tenant.id, code: "BOD", name: "Bodegón" },
  });

  await prisma.adOperator.upsert({
    where: {
      tenantId_username: { tenantId: tenant.id, username: "admin" },
    },
    update: {
      name: "Admin A&D",
      role: "admin",
      active: true,
      warehouseId: null,
      passwordHash,
    },
    create: {
      tenantId: tenant.id,
      username: "admin",
      name: "Admin A&D",
      role: "admin",
      warehouseId: null,
      passwordHash,
      userId: randomUUID(),
    },
  });

  await prisma.adCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "cervezas" } },
    update: { name: "Cervezas", active: true },
    create: {
      tenantId: tenant.id,
      name: "Cervezas",
      slug: "cervezas",
      active: true,
    },
  });
  await prisma.adCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "bodegon" } },
    update: { name: "Bodegón", active: true },
    create: {
      tenantId: tenant.id,
      name: "Bodegón",
      slug: "bodegon",
      active: true,
    },
  });

  const bcvExists = await prisma.adExchangeRate.findFirst({
    where: { tenantId: tenant.id, kind: "BCV" },
  });
  if (!bcvExists) {
    await prisma.adExchangeRate.create({
      data: {
        tenantId: tenant.id,
        kind: "BCV",
        rate: 40,
        reason: "seed inicial",
      },
    });
  }

  await prisma.adFinanceSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });

  async function ensureFinAccount(name: string, currency: "USD" | "BS") {
    const existing = await prisma.adFinancialAccount.findFirst({
      where: { tenantId: tenant.id, name },
    });
    if (existing) return existing;
    return prisma.adFinancialAccount.create({
      data: {
        tenantId: tenant.id,
        name,
        code: currency === "USD" ? "CAJA-USD" : "CAJA-BS",
        type: "CASH",
        currency,
        openingBalance: 0,
        balance: 0,
        active: true,
      },
    });
  }

  const cajaUsd = await ensureFinAccount("Caja USD", "USD");
  const cajaBs = await ensureFinAccount("Caja Bs", "BS");

  const paymentMethods: {
    code: string;
    name: string;
    currency: "USD" | "BS";
    requiresReference: boolean;
    financialAccountId?: string;
    sortOrder: number;
  }[] = [
    {
      code: "efectivo_usd",
      name: "Efectivo USD",
      currency: "USD",
      requiresReference: false,
      financialAccountId: cajaUsd.id,
      sortOrder: 10,
    },
    {
      code: "efectivo_bs",
      name: "Efectivo Bs",
      currency: "BS",
      requiresReference: false,
      financialAccountId: cajaBs.id,
      sortOrder: 20,
    },
    {
      code: "pago_movil",
      name: "Pago móvil",
      currency: "BS",
      requiresReference: true,
      sortOrder: 30,
    },
    {
      code: "transferencia",
      name: "Transferencia",
      currency: "BS",
      requiresReference: true,
      sortOrder: 40,
    },
    {
      code: "zelle",
      name: "Zelle",
      currency: "USD",
      requiresReference: true,
      sortOrder: 50,
    },
  ];

  for (const pm of paymentMethods) {
    await prisma.adPaymentMethod.upsert({
      where: {
        tenantId_code: { tenantId: tenant.id, code: pm.code },
      },
      update: {
        name: pm.name,
        currency: pm.currency,
        active: true,
        requiresReference: pm.requiresReference,
        sortOrder: pm.sortOrder,
      },
      create: {
        tenantId: tenant.id,
        code: pm.code,
        name: pm.name,
        currency: pm.currency,
        active: true,
        requiresReference: pm.requiresReference,
        financialAccountId: pm.financialAccountId,
        sortOrder: pm.sortOrder,
      },
    });
  }

  const fingerprint = createHash("sha256")
    .update(`${tenant.id}:${DEMO_PASSWORD}`)
    .digest("hex")
    .slice(0, 12);

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: tenant.id,
        slug: tenant.slug,
        warehouses: [
          { id: whLic.id, code: "LIC", name: whLic.name },
          { id: whBod.id, code: "BOD", name: whBod.name },
        ],
        operators: ["admin"],
        adminPassword: DEMO_PASSWORD,
        fingerprint,
        note: "Sin productos/clientes demo. Ejecute cleanup:ad-demo para limpiar datos viejos.",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
