/**
 * Endpoint Vercel del registro documental POLISUR.
 * Secrets: POLISUR_MEDIOS_CLAVE, GITHUB_TOKEN,
 * opcionales: POLISUR_MEDIOS_BRANCH, POLISUR_MEDIOS_REPO
 */

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
  if (!clave || clave !== expected) {
    const err = new Error("Clave institucional no válida.");
    err.statusCode = 401;
    throw err;
  }
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

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "health";

  try {
    if (req.method === "GET" && action === "health") {
      return json(res, 200, {
        ok: true,
        configured: Boolean(process.env.POLISUR_MEDIOS_CLAVE),
        github: Boolean(process.env.GITHUB_TOKEN),
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (req.method === "POST" && action === "auth") {
      assertClave(body.clave);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "upload") {
      assertClave(body.clave);
      if (!SLOT_PATHS.has(body.path)) {
        return json(res, 400, {
          ok: false,
          error: "Destino documental no autorizado.",
        });
      }
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
        path: body.path,
        contentBase64: base64,
        message: `chore(polisur): registrar asset ${body.path}`,
      });
      return json(res, 200, { ok: true, path: body.path, bytes, ...saved });
    }

    return json(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    return json(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en registro documental.",
    });
  }
};
