#!/usr/bin/env node
/**
 * Compila la UI de Donaive Software y empaqueta instaladores Electron.
 * Uso: node scripts/build-donaive-desktop.mjs [--linux] [--win] [--dir]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktop = path.join(root, "desktop", "donaive-software");
const distUi = path.join(desktop, "dist-ui");
const args = new Set(process.argv.slice(2));

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? root,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
    shell: false,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

console.log("1) Build UI (modo escritorio local)…");
run("npm", ["run", "build"], {
  env: {
    VITE_DONAIVE_SOFTWARE_HOST: "true",
    VITE_DONAIVE_DESKTOP: "true",
  },
});

const viteDist = path.join(root, "dist");
if (!fs.existsSync(path.join(viteDist, "index.html"))) {
  console.error("No se generó dist/index.html");
  process.exit(1);
}

console.log("2) Copiar UI a desktop/donaive-software/dist-ui…");
copyDir(viteDist, distUi);

console.log("3) Instalar dependencias Electron…");
if (!fs.existsSync(path.join(desktop, "node_modules", "electron"))) {
  run("npm", ["install"], { cwd: desktop });
}

const builderArgs = [];
if (args.has("--dir")) {
  builderArgs.push("--dir");
} else if (args.has("--win") && !args.has("--linux")) {
  builderArgs.push("--win", "nsis", "portable");
} else if (args.has("--linux") && !args.has("--win")) {
  builderArgs.push("--linux", "AppImage");
} else {
  // Por defecto: lo que el host pueda generar
  if (process.platform === "win32") {
    builderArgs.push("--win", "nsis", "portable");
  } else if (process.platform === "darwin") {
    builderArgs.push("--mac", "dmg");
  } else {
    builderArgs.push("--linux", "AppImage");
    if (args.has("--win") || args.has("--all")) {
      builderArgs.push("--win", "portable");
    }
  }
}

console.log("4) Empaquetar con electron-builder…");
run("npx", ["electron-builder", ...builderArgs], { cwd: desktop });

const releaseDir = path.join(desktop, "release");
console.log("\nListo. Instaladores en:", releaseDir);
if (fs.existsSync(releaseDir)) {
  for (const f of fs.readdirSync(releaseDir)) {
    const full = path.join(releaseDir, f);
    if (fs.statSync(full).isFile()) {
      const mb = (fs.statSync(full).size / (1024 * 1024)).toFixed(1);
      console.log(` - ${f} (${mb} MB)`);
    }
  }
}
