import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesRoot = path.resolve(__dirname, "../../../packages");

/**
 * Verifica que las dependencias monorepo (@donaive/core, @donaive/domain)
 * sean resolvibles desde apps/api — escenario equivalente a Render Root Directory.
 */
export function verifyMonorepoPackages() {
  const checks = {
    core: fs.existsSync(path.join(packagesRoot, "core/package.json")),
    domain: fs.existsSync(path.join(packagesRoot, "domain/package.json")),
  };

  return {
    ok: checks.core && checks.domain,
    packages: checks,
  };
}

if (process.argv[1]?.endsWith("verify-monorepo-deps.mjs")) {
  const result = verifyMonorepoPackages();
  if (!result.ok) {
    console.error("[verify-monorepo-deps] Paquetes no encontrados:", result.packages);
    process.exit(1);
  }
  console.log("[verify-monorepo-deps] OK — packages/core y packages/domain resolvibles");
}
