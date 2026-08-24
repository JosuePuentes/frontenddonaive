/**
 * Licencias Donaive Software — persistencia y lógica compartida (dev + Vercel).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

export const STORE_REL = "data/ds-licenses.json";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Ds-Admin-Clave",
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

function emptyStore() {
  return {
    licenses: [],
    requests: [],
    codes: [],
    activations: [],
    presidentUsers: [],
  };
}

export function normalizeStore(raw) {
  const base = emptyStore();
  if (!raw || typeof raw !== "object") return base;
  return {
    licenses: Array.isArray(raw.licenses) ? raw.licenses : [],
    requests: Array.isArray(raw.requests) ? raw.requests : [],
    codes: Array.isArray(raw.codes) ? raw.codes : [],
    activations: Array.isArray(raw.activations) ? raw.activations : [],
    presidentUsers: Array.isArray(raw.presidentUsers) ? raw.presidentUsers : [],
  };
}

export function readLocalStore(root) {
  const file = resolve(root, STORE_REL);
  if (!existsSync(file)) return emptyStore();
  try {
    return normalizeStore(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return emptyStore();
  }
}

export function writeLocalStore(root, store) {
  const file = resolve(root, STORE_REL);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(normalizeStore(store), null, 2)}\n`, "utf8");
}

export function assertAdminClave(clave) {
  const expected =
    process.env.DONAIVE_SOFTWARE_ADMIN_CLAVE ||
    process.env.POLISUR_MEDIOS_CLAVE ||
    "";
  if (!expected) {
    const err = new Error(
      "Acceso admin no configurado (falta DONAIVE_SOFTWARE_ADMIN_CLAVE).",
    );
    err.statusCode = 503;
    throw err;
  }
  if (!clave || String(clave).trim() !== String(expected).trim()) {
    const err = new Error("Clave admin no válida.");
    err.statusCode = 401;
    throw err;
  }
}

function githubConfig() {
  return {
    repo: process.env.DS_LICENSES_REPO || "JosuePuentes/frontenddonaive",
    branch: process.env.DS_LICENSES_BRANCH || "main",
    token: process.env.GITHUB_TOKEN || "",
  };
}

async function getGitHubStore() {
  const { repo, branch, token } = githubConfig();
  if (!token) {
    const err = new Error("GITHUB_TOKEN no configurado para licencias.");
    err.statusCode = 503;
    throw err;
  }
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_REL}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(api, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (res.status === 404) {
    return { sha: null, store: emptyStore() };
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub no leyó licencias (${res.status}): ${text}`);
    err.statusCode = 502;
    throw err;
  }
  const data = await res.json();
  try {
    const decoded = Buffer.from(data.content || "", "base64").toString("utf8");
    return { sha: data.sha, store: normalizeStore(JSON.parse(decoded)) };
  } catch {
    return { sha: data.sha, store: emptyStore() };
  }
}

async function putGitHubStore(store, sha, message) {
  const { repo, branch, token } = githubConfig();
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_REL}`;
  const content = Buffer.from(
    `${JSON.stringify(normalizeStore(store), null, 2)}\n`,
  ).toString("base64");
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
    const err = new Error(`GitHub no guardó licencias (${res.status}): ${text}`);
    err.statusCode = res.status === 409 ? 409 : 502;
    throw err;
  }
}

export async function readStore(mode, root) {
  if (mode === "local") {
    return readLocalStore(root);
  }
  const current = await getGitHubStore();
  return current.store;
}

export async function mutateStore(mode, root, mutator, message) {
  if (mode === "local") {
    const current = readLocalStore(root);
    const next = mutator(current);
    writeLocalStore(root, next);
    return next;
  }

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const current = await getGitHubStore();
      const next = mutator(current.store);
      await putGitHubStore(next, current.sha, message);
      return next;
    } catch (err) {
      lastErr = err;
      if (err.statusCode !== 409) throw err;
    }
  }
  throw lastErr;
}

function randomSegment(len) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function generateRequestCode() {
  return `DS-${randomSegment(6)}`;
}

export function generateActivationCode() {
  return `${randomSegment(4)}-${randomSegment(4)}`;
}

function activeActivations(store, licenseId) {
  return store.activations.filter(
    (a) => a.licenseId === licenseId && a.revoked !== true,
  );
}

function findLicense(store, licenseId) {
  return store.licenses.find((l) => l.id === licenseId) || null;
}

function normalizeCodeInput(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function createLicense(store, input) {
  const businessName = clean(input.businessName, 120);
  if (!businessName) {
    const err = new Error("Indique el nombre del negocio.");
    err.statusCode = 400;
    throw err;
  }
  const maxDevices = Math.max(1, Math.min(99, Number(input.maxDevices) || 1));
  const license = {
    id: `lic_${randomUUID().slice(0, 8)}`,
    businessName,
    maxDevices,
    status: "active",
    notes: clean(input.notes, 400) || undefined,
    createdAt: new Date().toISOString(),
  };
  return {
    ...store,
    licenses: [license, ...store.licenses],
  };
}

export function createActivationRequest(store, input) {
  const deviceFingerprint = clean(input.deviceFingerprint, 128);
  const deviceLabel = clean(input.deviceLabel, 160) || "Equipo desconocido";
  if (!deviceFingerprint || deviceFingerprint.length < 8) {
    const err = new Error("Identificador de equipo inválido.");
    err.statusCode = 400;
    throw err;
  }

  const pending = store.requests.find(
    (r) =>
      r.deviceFingerprint === deviceFingerprint &&
      r.status === "pending" &&
      !r.usedAt,
  );
  if (pending) {
    return store;
  }

  const request = {
    id: `req_${randomUUID().slice(0, 8)}`,
    requestCode: generateRequestCode(),
    deviceFingerprint,
    deviceLabel,
    status: "pending",
    licenseId: null,
    createdAt: new Date().toISOString(),
  };

  return {
    ...store,
    requests: [request, ...store.requests],
  };
}

export function approveRequest(store, input) {
  const requestId = clean(input.requestId, 80);
  const licenseId = clean(input.licenseId, 80);
  const request = store.requests.find((r) => r.id === requestId);
  const license = findLicense(store, licenseId);

  if (!request || request.status !== "pending") {
    const err = new Error("Solicitud no encontrada o ya procesada.");
    err.statusCode = 404;
    throw err;
  }
  if (!license || license.status !== "active") {
    const err = new Error("Licencia no válida.");
    err.statusCode = 400;
    throw err;
  }

  const activeCount = activeActivations(store, licenseId).length;
  if (activeCount >= license.maxDevices) {
    const err = new Error(
      `La licencia "${license.businessName}" ya alcanzó el límite de ${license.maxDevices} equipo(s).`,
    );
    err.statusCode = 409;
    throw err;
  }

  const codeValue = generateActivationCode();
  const code = {
    id: `code_${randomUUID().slice(0, 8)}`,
    code: codeValue,
    licenseId,
    requestId: request.id,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const requests = store.requests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: "approved",
          licenseId,
          approvedAt: new Date().toISOString(),
          activationCodeId: code.id,
        }
      : r,
  );

  return {
    ...store,
    requests,
    codes: [code, ...store.codes],
  };
}

export function rejectRequest(store, input) {
  const requestId = clean(input.requestId, 80);
  const request = store.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") {
    const err = new Error("Solicitud no encontrada o ya procesada.");
    err.statusCode = 404;
    throw err;
  }
  return {
    ...store,
    requests: store.requests.map((r) =>
      r.id === requestId
        ? { ...r, status: "rejected", rejectedAt: new Date().toISOString() }
        : r,
    ),
  };
}

export function generateStandaloneCode(store, input) {
  const licenseId = clean(input.licenseId, 80);
  const license = findLicense(store, licenseId);
  if (!license || license.status !== "active") {
    const err = new Error("Licencia no válida.");
    err.statusCode = 400;
    throw err;
  }

  const codeValue = generateActivationCode();
  const code = {
    id: `code_${randomUUID().slice(0, 8)}`,
    code: codeValue,
    licenseId,
    requestId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  return {
    store: {
      ...store,
      codes: [code, ...store.codes],
    },
    code,
  };
}

export function redeemActivationCode(store, input) {
  const codeInput = normalizeCodeInput(input.activationCode);
  const deviceFingerprint = clean(input.deviceFingerprint, 128);
  const deviceLabel = clean(input.deviceLabel, 160) || "Equipo desconocido";

  if (!codeInput || codeInput.length < 7) {
    const err = new Error("Código de activación inválido.");
    err.statusCode = 400;
    throw err;
  }
  if (!deviceFingerprint || deviceFingerprint.length < 8) {
    const err = new Error("Identificador de equipo inválido.");
    err.statusCode = 400;
    throw err;
  }

  const code = store.codes.find(
    (c) => normalizeCodeInput(c.code) === codeInput,
  );
  if (!code || code.status !== "pending") {
    const err = new Error("Código de activación no válido o ya usado.");
    err.statusCode = 400;
    throw err;
  }

  const license = findLicense(store, code.licenseId);
  if (!license || license.status !== "active") {
    const err = new Error("La licencia asociada no está activa.");
    err.statusCode = 403;
    throw err;
  }

  const existing = store.activations.find(
    (a) =>
      a.deviceFingerprint === deviceFingerprint &&
      a.licenseId === license.id &&
      a.revoked !== true,
  );
  if (existing) {
    return {
      store,
      result: {
        ok: true,
        alreadyActive: true,
        license,
        activation: existing,
      },
    };
  }

  const activeCount = activeActivations(store, license.id).length;
  if (activeCount >= license.maxDevices) {
    const err = new Error(
      "Esta licencia ya alcanzó el número máximo de equipos permitidos.",
    );
    err.statusCode = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const activation = {
    id: `act_${randomUUID().slice(0, 8)}`,
    licenseId: license.id,
    codeId: code.id,
    requestId: code.requestId || undefined,
    deviceFingerprint,
    deviceLabel,
    activatedAt: now,
    revoked: false,
  };

  const codes = store.codes.map((c) =>
    c.id === code.id ? { ...c, status: "used", usedAt: now, usedByDeviceFingerprint: deviceFingerprint } : c,
  );

  const requests = store.requests.map((r) =>
    r.id === code.requestId ? { ...r, usedAt: now } : r,
  );

  return {
    store: {
      ...store,
      codes,
      requests,
      activations: [activation, ...store.activations],
    },
    result: {
      ok: true,
      alreadyActive: false,
      license,
      activation,
    },
  };
}

export function checkDeviceActivation(store, input) {
  const deviceFingerprint = clean(input.deviceFingerprint, 128);
  const activationId = clean(input.activationId, 80);

  if (!deviceFingerprint) {
    const err = new Error("Identificador de equipo inválido.");
    err.statusCode = 400;
    throw err;
  }

  const activation = store.activations.find(
    (a) =>
      a.id === activationId &&
      a.deviceFingerprint === deviceFingerprint &&
      a.revoked !== true,
  );

  if (!activation) {
    return { ok: false, reason: "not_found" };
  }

  const license = findLicense(store, activation.licenseId);
  if (!license || license.status !== "active") {
    return { ok: false, reason: "license_inactive" };
  }

  return {
    ok: true,
    license,
    activation,
  };
}

export function revokeActivation(store, input) {
  const activationId = clean(input.activationId, 80);
  const activation = store.activations.find((a) => a.id === activationId);
  if (!activation) {
    const err = new Error("Activación no encontrada.");
    err.statusCode = 404;
    throw err;
  }
  return {
    ...store,
    activations: store.activations.map((a) =>
      a.id === activationId
        ? { ...a, revoked: true, revokedAt: new Date().toISOString() }
        : a,
    ),
  };
}

export function suspendLicense(store, input) {
  const licenseId = clean(input.licenseId, 80);
  const license = findLicense(store, licenseId);
  if (!license) {
    const err = new Error("Licencia no encontrada.");
    err.statusCode = 404;
    throw err;
  }
  return {
    ...store,
    licenses: store.licenses.map((l) =>
      l.id === licenseId ? { ...l, status: "suspended" } : l,
    ),
  };
}

export function getPendingRequestForDevice(store, deviceFingerprint) {
  return (
    store.requests.find(
      (r) =>
        r.deviceFingerprint === deviceFingerprint &&
        r.status === "pending",
    ) || null
  );
}

export function getLatestRequestForDevice(store, deviceFingerprint) {
  return (
    store.requests.find((r) => r.deviceFingerprint === deviceFingerprint) ||
    null
  );
}

export function findApprovedUnusedCodeForRequest(store, requestId) {
  const request = store.requests.find((r) => r.id === requestId);
  if (!request?.activationCodeId) return null;
  return store.codes.find((c) => c.id === request.activationCodeId) || null;
}

export function hashPassword(password) {
  let h = 0;
  const salt = "donaive-software-v1";
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `ds_${(h >>> 0).toString(16)}`;
}

export function createPresidentUser(store, input) {
  const licenseId = clean(input.licenseId, 80);
  const license = findLicense(store, licenseId);
  if (!license || license.status !== "active") {
    const err = new Error("Licencia no válida.");
    err.statusCode = 400;
    throw err;
  }
  const username = clean(input.username, 60).toLowerCase();
  const name = clean(input.name, 120);
  const password = String(input.password || "");
  if (!username || !name) {
    const err = new Error("Usuario y nombre requeridos.");
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error("La contraseña debe tener al menos 6 caracteres.");
    err.statusCode = 400;
    throw err;
  }
  const dup = store.presidentUsers.find(
    (u) =>
      u.licenseId === licenseId &&
      u.username === username &&
      u.active !== false,
  );
  if (dup) {
    const err = new Error("Ese usuario presidente ya existe en esta licencia.");
    err.statusCode = 409;
    throw err;
  }
  const user = {
    id: `pres_${randomUUID().slice(0, 8)}`,
    licenseId,
    username,
    name,
    passwordHash: hashPassword(password),
    active: true,
    createdAt: new Date().toISOString(),
  };
  return {
    ...store,
    presidentUsers: [user, ...store.presidentUsers],
  };
}

export function deactivatePresidentUser(store, input) {
  const userId = clean(input.userId, 80);
  const user = store.presidentUsers.find((u) => u.id === userId);
  if (!user) {
    const err = new Error("Usuario presidente no encontrado.");
    err.statusCode = 404;
    throw err;
  }
  return {
    ...store,
    presidentUsers: store.presidentUsers.map((u) =>
      u.id === userId ? { ...u, active: false } : u,
    ),
  };
}

export function presidentLogin(store, input) {
  const licenseId = clean(input.licenseId, 80);
  const username = clean(input.username, 60).toLowerCase();
  const password = String(input.password || "");
  const license = findLicense(store, licenseId);
  if (!license || license.status !== "active") {
    return { ok: false, error: "Licencia no activa." };
  }
  const user = store.presidentUsers.find(
    (u) =>
      u.licenseId === licenseId &&
      u.username === username &&
      u.active !== false,
  );
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: "Credenciales incorrectas." };
  }
  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: "presidente",
      licenseId,
    },
  };
}
