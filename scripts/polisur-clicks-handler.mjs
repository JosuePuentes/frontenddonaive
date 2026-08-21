import { assertAuthorized } from "./lib/polisur-medios-core.mjs";
import {
  applyTrack,
  normalizeTrack,
  readJsonBody,
  readStats,
  sendJson,
  writeStats,
} from "./lib/polisur-clicks-core.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Polisur-Clave",
  );
}

export async function handlePolisurClicksRequest(req, res, opts) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const root = opts.root;
  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "stats";

  try {
    if (req.method === "POST" && action === "track") {
      const body = await readJsonBody(req);
      const track = normalizeTrack(body);
      const stats = applyTrack(readStats(root), track);
      writeStats(root, stats);
      sendJson(res, 200, { ok: true, stats });
      return;
    }

    if (req.method === "GET" && action === "stats") {
      const clave = url.searchParams.get("clave") || "";
      assertAuthorized(clave);
      sendJson(res, 200, { ok: true, stats: readStats(root) });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    sendJson(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en contadores.",
    });
  }
}

export function createPolisurClicksVitePlugin(rootDir) {
  return {
    name: "polisur-clicks",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/polisur-clicks")) {
          next();
          return;
        }
        await handlePolisurClicksRequest(req, res, { root: rootDir });
      });
    },
  };
}
