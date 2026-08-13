#!/usr/bin/env node
/**
 * Verifica presencia de assets reales de POLISUR.
 * No genera ni modifica imágenes: solo detecta archivos en disco.
 *
 * Uso: node scripts/verify-polisur-assets.mjs
 * Exit 0 = todos presentes; exit 1 = faltan assets.
 */

import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

const REQUIRED = [
  "public/polisur/logo/escudo.png",
  "public/polisur/logo/parche.png",
  "public/polisur/logo/k9-emblema.png",
  "public/polisur/home/hero.jpg",
  "public/polisur/home/about.jpg",
  "public/polisur/home/canina.jpg",
  "public/polisur/home/ciudadania.jpg",
  "public/polisur/unidad-canina/hero.jpg",
  "public/polisur/unidad-canina/entrenamiento.jpg",
  "public/polisur/unidad-canina/binomio.png",
];

function check(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) {
    return { rel, status: "MISSING", bytes: 0 };
  }
  const bytes = statSync(abs).size;
  if (bytes <= 0) {
    return { rel, status: "EMPTY", bytes: 0 };
  }
  return { rel, status: "OK", bytes };
}

const results = REQUIRED.map(check);
const ok = results.filter((r) => r.status === "OK");
const missing = results.filter((r) => r.status !== "OK");

console.log("POLISUR assets check\n");
for (const r of results) {
  const size = r.bytes ? ` (${r.bytes} bytes)` : "";
  console.log(`${r.status.padEnd(8)} ${r.rel}${size}`);
}

console.log(
  `\nResumen: ${ok.length}/${REQUIRED.length} presentes${
    missing.length ? `, faltan ${missing.length}` : ""
  }.`,
);

if (missing.length) {
  console.log("\nPendientes:");
  for (const r of missing) console.log(`  - ${r.rel}`);
  process.exit(1);
}

process.exit(0);
