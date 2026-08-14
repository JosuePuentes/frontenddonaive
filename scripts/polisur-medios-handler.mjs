/**
 * Middleware / servidor del registro documental POLISUR (solo disco local).
 * No altera píxeles: guarda el binario tal cual en la ruta canónica.
 */
import {
  assertAuthorized,
  assertSlotPath,
  listSlotStatus,
  readJsonBody,
  sendJson,
  writeSlotFile,
  deleteSlotFile,
} from "./lib/polisur-medios-core.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Polisur-Clave");
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ root: string }} opts
 */
export async function handlePolisurMediosRequest(req, res, opts) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const root = opts.root;
  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "status";

  try {
    if (req.method === "GET" && action === "health") {
      sendJson(res, 200, {
        ok: true,
        configured: Boolean(
          process.env.POLISUR_MEDIOS_CLAVE ||
            process.env.VITE_POLISUR_MEDIOS_CLAVE,
        ),
      });
      return;
    }

    if (req.method === "POST" && action === "auth") {
      const body = await readJsonBody(req);
      assertAuthorized(body.clave);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && action === "status") {
      const clave = url.searchParams.get("clave") || "";
      assertAuthorized(clave);
      sendJson(res, 200, { ok: true, slots: listSlotStatus(root) });
      return;
    }

    if (req.method === "POST" && action === "upload") {
      const body = await readJsonBody(req);
      assertAuthorized(body.clave);
      const rel = assertSlotPath(body.path);
      if (!body.dataBase64 || typeof body.dataBase64 !== "string") {
        sendJson(res, 400, { ok: false, error: "Falta el archivo." });
        return;
      }
      const base64 = body.dataBase64.includes(",")
        ? body.dataBase64.split(",")[1]
        : body.dataBase64;
      const buffer = Buffer.from(base64, "base64");
      if (!buffer.length) {
        sendJson(res, 400, { ok: false, error: "Archivo vacío." });
        return;
      }
      // Límite ~12MB para móvil
      if (buffer.length > 12 * 1024 * 1024) {
        sendJson(res, 413, {
          ok: false,
          error: "El archivo supera el límite de 12MB.",
        });
        return;
      }
      const saved = await writeSlotFile(root, rel, buffer);
      sendJson(res, 200, { ok: true, ...saved });
      return;
    }

    if (req.method === "POST" && action === "delete") {
      const body = await readJsonBody(req);
      assertAuthorized(body.clave);
      const rel = assertSlotPath(body.path);
      const removed = deleteSlotFile(root, rel);
      sendJson(res, 200, { ok: true, ...removed });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    const status = err.statusCode || 500;
    sendJson(res, status, {
      ok: false,
      error: err.message || "Error en registro documental.",
    });
  }
}

export function createPolisurMediosVitePlugin(rootDir) {
  return {
    name: "polisur-medios-upload",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/polisur-medios")) {
          next();
          return;
        }
        await handlePolisurMediosRequest(req, res, { root: rootDir });
      });
    },
  };
}
