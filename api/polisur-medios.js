/**
 * Endpoint Vercel del registro documental POLISUR.
 * Secrets: POLISUR_MEDIOS_CLAVE, GITHUB_TOKEN
 * opcionales: POLISUR_MEDIOS_BRANCH, POLISUR_MEDIOS_REPO
 */

const SLOT_PATHS = new Set([
  "public/polisur/logo/escudo.png",
  "public/polisur/logo/parche.png",
  "public/polisur/logo/k9-emblema.png",
  "public/polisur/logo/visipol.png",
  "public/polisur/logo/cuadrantes-paz.png",
  "public/polisur/logo/justicia-paz.png",
  "public/polisur/home/hero.jpg",
  "public/polisur/home/about.jpg",
  "public/polisur/home/canina.jpg",
  "public/polisur/home/ciudadania.jpg",
  "public/polisur/unidad-canina/hero.jpg",
  "public/polisur/unidad-canina/entrenamiento.jpg",
  "public/polisur/unidad-canina/binomio.png",
]);

const CUSTOM_PATH =
  /^public\/polisur\/(logo|home|unidad-canina|extras)\/[a-z0-9][a-z0-9-]{0,39}\.(png|jpg|webp)$/;

function assertAllowedPath(relPath) {
  const clean = String(relPath || "").replace(/\\/g, "/");
  if (!SLOT_PATHS.has(clean) && !CUSTOM_PATH.test(clean)) {
    const err = new Error("Destino documental no autorizado.");
    err.statusCode = 400;
    throw err;
  }
  return clean;
}

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
      "Registro documental no configurado (falta POLISUR_MEDIOS_CLAVE).",
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
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function putGitHub({ path, contentBase64, message }) {
  const repo =
    process.env.POLISUR_MEDIOS_REPO || "JosuePuentes/frontenddonaive";
  const branch =
    process.env.POLISUR_MEDIOS_BRANCH ||
    "cursor/polisur-portal-fotografico-335d";
  const token = process.env.GITHUB_TOKEN;
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;

  let sha;
  const existing = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (existing.ok) {
    const data = await existing.json();
    sha = data.sha;
  }

  const res = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `GitHub no aceptó el archivo (${res.status}): ${text}`,
    );
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  return { commit: data.commit?.sha || null };
}

async function deleteGitHub({ path }) {
  const repo =
    process.env.POLISUR_MEDIOS_REPO || "JosuePuentes/frontenddonaive";
  const branch =
    process.env.POLISUR_MEDIOS_BRANCH ||
    "cursor/polisur-portal-fotografico-335d";
  const token = process.env.GITHUB_TOKEN;
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;

  const existing = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!existing.ok) {
    const err = new Error("El archivo no existe en el repositorio.");
    err.statusCode = 404;
    throw err;
  }
  const data = await existing.json();
  const res = await fetch(api, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore(polisur): eliminar asset ${path}`,
      sha: data.sha,
      branch,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `GitHub no eliminó el archivo (${res.status}): ${text}`,
    );
    err.statusCode = 502;
    throw err;
  }
  const payload = await res.json();
  return { commit: payload.commit?.sha || null };
}

async function listRepoAssets() {
  const repo =
    process.env.POLISUR_MEDIOS_REPO || "JosuePuentes/frontenddonaive";
  const branch =
    process.env.POLISUR_MEDIOS_BRANCH ||
    "cursor/polisur-portal-fotografico-335d";
  const token = process.env.GITHUB_TOKEN;
  const folders = ["logo", "home", "unidad-canina", "extras"];
  const items = [];

  for (const folder of folders) {
    const api = `https://api.github.com/repos/${repo}/contents/public/polisur/${folder}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(api, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          }
        : { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (!Array.isArray(data)) continue;
    for (const file of data) {
      if (file.type !== "file" || file.name === ".gitkeep") continue;
      items.push({
        path: file.path,
        status: "OK",
        bytes: file.size || 0,
      });
    }
  }
  return items;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "health";

  try {
    if (req.method === "GET" && (action === "health" || action === "status")) {
      if (action === "health") {
        return json(res, 200, {
          ok: true,
          configured: Boolean(process.env.POLISUR_MEDIOS_CLAVE),
          github: Boolean(process.env.GITHUB_TOKEN),
        });
      }
      const clave = url.searchParams.get("clave") || "";
      assertClave(clave);
      const listed = await listRepoAssets();
      return json(res, 200, { ok: true, slots: listed });
    }

    const body = req.method === "POST" ? await readBody(req) : {};

    if (req.method === "POST" && action === "auth") {
      assertClave(body.clave);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "upload") {
      assertClave(body.clave);
      const dest = assertAllowedPath(body.path);
      if (!process.env.GITHUB_TOKEN) {
        return json(res, 503, {
          ok: false,
          error: "Falta GITHUB_TOKEN para registrar en el repositorio.",
        });
      }
      if (!body.dataBase64) {
        return json(res, 400, { ok: false, error: "Falta el archivo." });
      }
      const base64 = String(body.dataBase64).includes(",")
        ? String(body.dataBase64).split(",")[1]
        : String(body.dataBase64);
      const bytes = Buffer.from(base64, "base64").length;
      if (bytes > 12 * 1024 * 1024) {
        return json(res, 413, {
          ok: false,
          error: "El archivo supera el límite de 12MB.",
        });
      }
      const saved = await putGitHub({
        path: dest,
        contentBase64: base64,
        message: `chore(polisur): registrar asset ${dest}`,
      });
      return json(res, 200, { ok: true, path: dest, bytes, ...saved });
    }

    if (req.method === "POST" && action === "delete") {
      assertClave(body.clave);
      const dest = assertAllowedPath(body.path);
      if (!process.env.GITHUB_TOKEN) {
        return json(res, 503, {
          ok: false,
          error: "Falta GITHUB_TOKEN para eliminar en el repositorio.",
        });
      }
      const removed = await deleteGitHub({ path: dest });
      return json(res, 200, { ok: true, path: dest, ...removed });
    }

    return json(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    return json(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en registro documental.",
    });
  }
}
