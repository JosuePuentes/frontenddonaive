/**
 * Preinscripciones POLISUR.
 * POST action=submit  — público
 * GET  action=list    — clave institucional
 *
 * Secrets: POLISUR_MEDIOS_CLAVE, GITHUB_TOKEN
 * opcionales: POLISUR_MEDIOS_BRANCH, POLISUR_MEDIOS_REPO
 */

import { randomUUID } from "node:crypto";

const STORE_PATH = "data/polisur-preinscripciones.json";
const MAX_RECORDS = 5000;
const UNIT_IDS = new Set([
  "institucion",
  "unidad-canina",
  "unidades-operativas",
  "prevencion",
]);

function json(res, status, body) {
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

function assertClave(clave) {
  const expected = process.env.POLISUR_MEDIOS_CLAVE || "";
  if (!expected) {
    const err = new Error(
      "Acceso institucional no configurado (falta POLISUR_MEDIOS_CLAVE).",
    );
    err.statusCode = 503;
    throw err;
  }
  if (!clave || String(clave).trim() !== String(expected).trim()) {
    const err = new Error("Clave institucional no válida.");
    err.statusCode = 401;
    throw err;
  }
}

function githubConfig() {
  return {
    repo: process.env.POLISUR_MEDIOS_REPO || "JosuePuentes/frontenddonaive",
    branch: process.env.POLISUR_PREINSCRIPCIONES_BRANCH || "main",
    token: process.env.GITHUB_TOKEN || "",
  };
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

function normalizePayload(body) {
  const nombres = clean(body.nombres, 80);
  const apellidos = clean(body.apellidos, 80);
  const cedula = clean(body.cedula, 24);
  const correo = clean(body.correo, 120).toLowerCase();
  const telefono = clean(body.telefono, 32);
  const unidad = clean(body.unidad, 40);
  const mensaje = clean(body.mensaje, 800);
  const website = clean(body.website, 120);

  if (website) return { honeypot: true };
  if (!nombres || !apellidos) {
    const err = new Error("Indique nombres y apellidos.");
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

async function readBody(req) {
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

async function getGitHubFile() {
  const { repo, branch, token } = githubConfig();
  if (!token) {
    const err = new Error("Falta GITHUB_TOKEN para guardar preinscripciones.");
    err.statusCode = 503;
    throw err;
  }
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(api, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (res.status === 404) {
    return { sha: null, items: [] };
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub no leyó el registro (${res.status}): ${text}`);
    err.statusCode = 502;
    throw err;
  }
  const data = await res.json();
  let items = [];
  try {
    const decoded = Buffer.from(data.content || "", "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }
  return { sha: data.sha, items };
}

async function putGitHubFile({ items, sha, message }) {
  const { repo, branch, token } = githubConfig();
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}`;
  const content = Buffer.from(`${JSON.stringify(items, null, 2)}\n`).toString(
    "base64",
  );
  const res = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `GitHub no guardó la preinscripción (${res.status}): ${text}`,
    );
    err.statusCode = res.status === 409 ? 409 : 502;
    throw err;
  }
}

async function appendWithRetry(record) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const current = await getGitHubFile();
      if (current.items.length >= MAX_RECORDS) {
        const err = new Error("El registro de preinscripciones está saturado.");
        err.statusCode = 507;
        throw err;
      }
      const items = [record, ...current.items];
      await putGitHubFile({
        items,
        sha: current.sha,
        message: `chore(polisur): preinscripción ${record.id}`,
      });
      return;
    } catch (err) {
      lastErr = err;
      if (err.statusCode !== 409) throw err;
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "list";

  try {
    if (req.method === "POST" && action === "submit") {
      const body = await readBody(req);
      const result = normalizePayload(body);
      if (result.honeypot) {
        return json(res, 200, { ok: true });
      }
      await appendWithRetry(result.record);
      return json(res, 200, { ok: true, id: result.record.id });
    }

    if (req.method === "GET" && action === "list") {
      const clave = url.searchParams.get("clave") || "";
      assertClave(clave);
      const current = await getGitHubFile();
      return json(res, 200, { ok: true, items: current.items });
    }

    return json(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    return json(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en preinscripciones.",
    });
  }
}
