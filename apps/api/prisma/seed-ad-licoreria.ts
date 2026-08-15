/**
 * Seed reproducible A&D Licorería & Bodegón (Fase 4).
 * Idempotente: reutiliza tenant slug `ad-licoreria` si existe.
 *
 * Uso:
 *   cd apps/api && npx tsx prisma/seed-ad-licoreria.ts
 */
import { PrismaClient, type AdOperatorRole } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { hashPassword } from "../src/ad/password.js";

const prisma = new PrismaClient();

/** Contraseña demo reproducible (todos los operadores de este seed). */
const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";

type OpSeed = {
  username: string;
  name: string;
  role: AdOperatorRole;
  warehouseCode?: "LIC" | "BOD";
};

/**
 * ADMIN demo canónico para prueba en navegador:
 *   usuario: admin
 *   password: AdDemo#2026 (o AD_SEED_PASSWORD)
 *   rol: admin · permisos: todos · depósito: transversal (null)
 * Ver docs/ad-licoreria/DEMO-CREDENTIALS.md — no mostrar en UI pública.
 */
const OPERATORS: OpSeed[] = [
  { username: "admin", name: "Admin A&D", role: "admin" },
  { username: "supervisor", name: "Supervisor A&D", role: "supervisor" },
  {
    username: "cajero.lic",
    name: "Cajero Licorería",
    role: "cajero",
    warehouseCode: "LIC",
  },
  {
    username: "cajero.bod",
    name: "Cajero Bodegón",
    role: "cajero",
    warehouseCode: "BOD",
  },
  {
    username: "mesonera.lic",
    name: "Mesonera Licorería",
    role: "mesonera",
    warehouseCode: "LIC",
  },
  {
    username: "mesonera.bod",
    name: "Mesonera Bodegón",
    role: "mesonera",
    warehouseCode: "BOD",
  },
  { username: "inventario", name: "Inventario A&D", role: "inventario" },
  { username: "tv", name: "Pantalla TV", role: "tv" },
];

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

  const whByCode = { LIC: whLic, BOD: whBod } as const;

  for (const op of OPERATORS) {
    const warehouseId = op.warehouseCode
      ? whByCode[op.warehouseCode].id
      : null;
    await prisma.adOperator.upsert({
      where: {
        tenantId_username: { tenantId: tenant.id, username: op.username },
      },
      update: {
        name: op.name,
        role: op.role,
        active: true,
        warehouseId,
        passwordHash,
      },
      create: {
        tenantId: tenant.id,
        username: op.username,
        name: op.name,
        role: op.role,
        warehouseId,
        passwordHash,
        userId: randomUUID(),
      },
    });
  }

  const catLic = await prisma.adCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "cervezas" } },
    update: { name: "Cervezas", active: true },
    create: {
      tenantId: tenant.id,
      name: "Cervezas",
      slug: "cervezas",
      active: true,
    },
  });
  const catBod = await prisma.adCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "bodegon" } },
    update: { name: "Bodegón", active: true },
    create: {
      tenantId: tenant.id,
      name: "Bodegón",
      slug: "bodegon",
      active: true,
    },
  });

  async function ensureProduct(input: {
    name: string;
    brand: string;
    sku: string;
    categoryId: string;
    baseUnitLabel: string;
    presentations: {
      name: string;
      code: string;
      units: number;
      priceUsd: number;
      priceBs: number;
    }[];
    stockLic: number;
    stockBod: number;
  }) {
    let product = await prisma.adProduct.findFirst({
      where: { tenantId: tenant.id, sku: input.sku },
    });
    if (!product) {
      product = await prisma.adProduct.create({
        data: {
          tenantId: tenant.id,
          categoryId: input.categoryId,
          name: input.name,
          brand: input.brand,
          sku: input.sku,
          baseUnitLabel: input.baseUnitLabel,
          minStockBase: 12,
          active: true,
        },
      });
    }
    for (const pr of input.presentations) {
      const existing = await prisma.adPresentation.findFirst({
        where: { productId: product.id, code: pr.code },
      });
      if (!existing) {
        await prisma.adPresentation.create({
          data: {
            productId: product.id,
            name: pr.name,
            code: pr.code,
            unitsPerPresentation: pr.units,
            priceUsd: pr.priceUsd,
            priceBs: pr.priceBs,
            active: true,
          },
        });
      }
    }
    for (const [wh, qty] of [
      [whLic.id, input.stockLic],
      [whBod.id, input.stockBod],
    ] as const) {
      await prisma.adStock.upsert({
        where: {
          warehouseId_productId: { warehouseId: wh, productId: product.id },
        },
        update: { qtyBase: qty },
        create: { warehouseId: wh, productId: product.id, qtyBase: qty },
      });
    }
    return product;
  }

  await ensureProduct({
    name: "Cerveza Regional",
    brand: "Regional",
    sku: "CER-REG",
    categoryId: catLic.id,
    baseUnitLabel: "unidad",
    presentations: [
      { name: "Unidad", code: "U", units: 1, priceUsd: 1.2, priceBs: 480 },
      { name: "Balde x6", code: "BAL6", units: 6, priceUsd: 6.5, priceBs: 2600 },
      { name: "Caja x36", code: "CJ36", units: 36, priceUsd: 36, priceBs: 14400 },
    ],
    stockLic: 120,
    stockBod: 48,
  });

  await ensureProduct({
    name: "Cerveza Polar",
    brand: "Polar",
    sku: "CER-POL",
    categoryId: catLic.id,
    baseUnitLabel: "unidad",
    presentations: [
      { name: "Unidad", code: "U", units: 1, priceUsd: 1.1, priceBs: 440 },
      { name: "Balde x6", code: "BAL6", units: 6, priceUsd: 6, priceBs: 2400 },
      { name: "Caja x24", code: "CJ24", units: 24, priceUsd: 22, priceBs: 8800 },
    ],
    stockLic: 96,
    stockBod: 36,
  });

  await ensureProduct({
    name: "Ron Añejo",
    brand: "Santa Teresa",
    sku: "RON-ST",
    categoryId: catLic.id,
    baseUnitLabel: "botella",
    presentations: [
      { name: "Botella 0.75L", code: "B75", units: 1, priceUsd: 18, priceBs: 7200 },
      { name: "Caja x12", code: "CJ12", units: 12, priceUsd: 200, priceBs: 80000 },
    ],
    stockLic: 24,
    stockBod: 6,
  });

  await ensureProduct({
    name: "Agua mineral",
    brand: "Minalba",
    sku: "AGU-MIN",
    categoryId: catBod.id,
    baseUnitLabel: "unidad",
    presentations: [
      { name: "Unidad", code: "U", units: 1, priceUsd: 0.8, priceBs: 320 },
      { name: "Paquete x12", code: "P12", units: 12, priceUsd: 8, priceBs: 3200 },
    ],
    stockLic: 40,
    stockBod: 80,
  });

  await ensureProduct({
    name: "Snack mixto",
    brand: "Toddy",
    sku: "SNK-MIX",
    categoryId: catBod.id,
    baseUnitLabel: "unidad",
    presentations: [
      { name: "Unidad", code: "U", units: 1, priceUsd: 1.5, priceBs: 600 },
      { name: "Display x20", code: "D20", units: 20, priceUsd: 28, priceBs: 11200 },
    ],
    stockLic: 30,
    stockBod: 100,
  });

  // Espacios demo
  const spaces = [
    { name: "Mesa 1", number: "1", code: "MESA-01", spaceType: "mesa", warehouseId: whLic.id },
    { name: "Mesa 2", number: "2", code: "MESA-02", spaceType: "mesa", warehouseId: whLic.id },
    { name: "Barra A", number: "BA", code: "BAR-A", spaceType: "barra", warehouseId: whLic.id },
    { name: "Terraza 1", number: "T1", code: "TER-01", spaceType: "terraza", warehouseId: whBod.id },
  ];
  for (const s of spaces) {
    const existing = await prisma.adTableSpace.findFirst({
      where: { tenantId: tenant.id, code: s.code },
    });
    if (!existing) {
      await prisma.adTableSpace.create({
        data: {
          tenantId: tenant.id,
          name: s.name,
          number: s.number,
          code: s.code,
          spaceType: s.spaceType,
          capacity: 4,
          status: "disponible",
          warehouseId: s.warehouseId,
          active: true,
        },
      });
    }
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
        operators: OPERATORS.map((o) => o.username),
        demoPassword: DEMO_PASSWORD,
        fingerprint,
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
