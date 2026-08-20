/**
 * Elimina datos de prueba del tenant `ad-licoreria`.
 *
 * Uso:
 *   cd apps/api && npm run cleanup:ad-demo
 */
import { PrismaClient } from "@prisma/client";
import { cleanupAdLicoreriaDemoBySlug } from "../src/ad/cleanup-demo-data.js";

const prisma = new PrismaClient();

async function main() {
  const result = await cleanupAdLicoreriaDemoBySlug(prisma);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
