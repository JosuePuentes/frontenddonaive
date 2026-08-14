/**
 * Persistencia local de preinscripciones POLISUR (disco, no público).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

export const STORE_REL = "data/polisur-preinscripciones.json";
const MAX_RECORDS = 5000;

const UNIT_IDS = new Set([
  "institucion",
  "unidad-canina",
  "unidades-operativas",
  "prevencion",
]);

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Polisur-Clave",
  );
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }
  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString("utf8");
    return text ? JSON.parse(text) : {};
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function clean(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function looksLikeEmail(value) {
  const at = value.indexOf("@");
  const dot = value.lastIndexOf(".");
  return at > 0 && dot > at + 1 && dot < value.length - 1;
}

export function normalizePayload(body) {
  const nombres = clean(body.nombres, 80);
  const apellidos = clean(body.apellidos, 80);
  const cedula = clean(body.cedula, 24);
  const correo = clean(body.correo, 120).toLowerCase();
  const telefono = clean(body.telefono, 32);
  const unidad = clean(body.unidad, 40);
  const mensaje = clean(body.mensaje, 800);
  const website = clean(body.website, 120);

  if (website) {
    return { honeypot: true };
  }
  if (!nombres || !apellidos) {
    const err = new Error("Indique nombres y apellidos.");
    err.statusCode = 400;
    throw err;
  }
  const cedulaDigits = cedula.replace(/\D/g, "");
  if (cedulaDigits.length < 6 || cedulaDigits.length > 10) {
    const err = new Error("Indique una cédula válida.");
    err.statusCode = 400;
    throw err;
  }
  if (!looksLikeEmail(correo)) {
    const err = new Error("Indique un correo válido.");
    err.statusCode = 400;
    throw err;
  }
  const digits = telefono.replace(/\D/g, "");
  if (digits.length < 7) {
    const err = new Error("Indique un número de teléfono válido.");
    err.statusCode = 400;
    throw err;
  }
  if (!UNIT_IDS.has(unidad)) {
    const err = new Error("Seleccione la unidad de interés.");
    err.statusCode = 400;
    throw err;
  }

  return {
    honeypot: false,
    record: {
      id: `ps-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`,
      nombres,
      apellidos,
      cedula,
      correo,
      telefono,
      unidad,
      mensaje,
      createdAt: new Date().toISOString(),
    },
  };
}

function resolveStore(root) {
  const abs = resolve(root, STORE_REL);
  const rootAbs = resolve(root);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + sep)) {
    const err = new Error("Ruta inválida.");
    err.statusCode = 400;
    throw err;
  }
  return abs;
}

export function readStore(root) {
  const abs = resolveStore(root);
  if (!existsSync(abs)) return [];
  try {
    const parsed = JSON.parse(readFileSync(abs, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStore(root, records) {
  const abs = resolveStore(root);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export function appendRecord(root, record) {
  const records = readStore(root);
  if (records.length >= MAX_RECORDS) {
    const err = new Error("El registro de preinscripciones está saturado.");
    err.statusCode = 507;
    throw err;
  }
  const next = [record, ...records];
  writeStore(root, next);
  return record;
}
