/**
 * Lógica compartida del registro documental POLISUR.
 * Escribe archivos en disco sin modificar el contenido binario de la imagen.
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const SLOT_PATHS = new Set([
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
]);

export function getMediosClave() {
  return (
    process.env.POLISUR_MEDIOS_CLAVE ||
    process.env.VITE_POLISUR_MEDIOS_CLAVE ||
    ""
  );
}

export function assertAuthorized(clave) {
  const expected = getMediosClave();
  if (!expected) {
    const err = new Error(
      "Registro documental no configurado (falta POLISUR_MEDIOS_CLAVE).",
    );
    err.statusCode = 503;
    throw err;
  }
  if (!clave || clave !== expected) {
    const err = new Error("Clave institucional no válida.");
    err.statusCode = 401;
    throw err;
  }
}

export function assertSlotPath(relPath) {
  const clean = String(relPath || "").replace(/\\/g, "/");
  if (!SLOT_PATHS.has(clean)) {
    const err = new Error("Destino documental no autorizado.");
    err.statusCode = 400;
    throw err;
  }
  return clean;
}

export function resolveSafePath(root, relPath) {
  const abs = resolve(root, relPath);
  const rootAbs = resolve(root);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + sep)) {
    const err = new Error("Ruta inválida.");
    err.statusCode = 400;
    throw err;
  }
  return abs;
}

export function listSlotStatus(root) {
  return [...SLOT_PATHS].map((rel) => {
    const abs = resolveSafePath(root, rel);
    if (!existsSync(abs)) {
      return { path: rel, status: "MISSING", bytes: 0 };
    }
    const bytes = statSync(abs).size;
    return {
      path: rel,
      status: bytes > 0 ? "OK" : "EMPTY",
      bytes,
    };
  });
}

export async function writeSlotFile(root, relPath, buffer) {
  const safeRel = assertSlotPath(relPath);
  const abs = resolveSafePath(root, safeRel);
  mkdirSync(dirname(abs), { recursive: true });
  await pipeline(Readable.from(buffer), createWriteStream(abs));
  return { path: safeRel, bytes: buffer.length };
}

export function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolvePromise(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export { SLOT_PATHS };
