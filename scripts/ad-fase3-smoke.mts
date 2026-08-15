/**
 * Smoke A&D Fase 3 — contrato asAdAsync (sin Vite/DB).
 * Ejecutar: cd /workspace && npx tsx scripts/ad-fase3-smoke.mts
 */
import { asAdAsync } from "../src/services/ad-licoreria/async-result.ts";

async function main() {
  const syncOk = await asAdAsync({ ok: true as const, data: 42 });
  if (!syncOk.ok || syncOk.data !== 42) throw new Error("sync asAdAsync failed");

  const asyncOk = await asAdAsync(
    Promise.resolve({ ok: true as const, data: "api" }),
  );
  if (!asyncOk.ok || asyncOk.data !== "api") throw new Error("async asAdAsync failed");

  const fail = await asAdAsync({ ok: false as const, error: "x" });
  if (fail.ok || fail.error !== "x") throw new Error("fail asAdAsync failed");

  console.log("PASS asAdAsync sync|async contract");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
