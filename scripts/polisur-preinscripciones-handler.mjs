import { assertAuthorized } from "./lib/polisur-medios-core.mjs";
import {
  appendRecord,
  allowedUnitIds,
  normalizePayload,
  readJsonBody,
  readStore,
  sendJson,
} from "./lib/polisur-preinscripciones-core.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Polisur-Clave",
  );
}

export async function handlePolisurPreinscripcionesRequest(req, res, opts) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const root = opts.root;
  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "list";

  try {
    if (req.method === "POST" && action === "submit") {
      const body = await readJsonBody(req);
      const result = normalizePayload(body, allowedUnitIds(root));
      if (result.honeypot) {
        sendJson(res, 200, { ok: true });
        return;
      }
      const saved = appendRecord(root, result.record);
      sendJson(res, 200, { ok: true, id: saved.id });
      return;
    }

    if (req.method === "GET" && action === "list") {
      const clave = url.searchParams.get("clave") || "";
      assertAuthorized(clave);
      sendJson(res, 200, { ok: true, items: readStore(root) });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    sendJson(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en preinscripciones.",
    });
  }
}

export function createPolisurPreinscripcionesVitePlugin(rootDir) {
  return {
    name: "polisur-preinscripciones",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/polisur-preinscripciones")) {
          next();
          return;
        }
        await handlePolisurPreinscripcionesRequest(req, res, { root: rootDir });
      });
    },
  };
}
