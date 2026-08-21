import { assertAuthorized } from "./lib/polisur-medios-core.mjs";
import {
  defaultSite,
  readJsonBody,
  readStore,
  sendJson,
  writeStore,
} from "./lib/polisur-site-core.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Polisur-Clave",
  );
}

export async function handlePolisurSiteRequest(req, res, opts) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const root = opts.root;
  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "get";

  try {
    if (req.method === "GET" && action === "get") {
      sendJson(res, 200, { ok: true, site: readStore(root) });
      return;
    }

    if (req.method === "POST" && action === "save") {
      const body = await readJsonBody(req);
      assertAuthorized(body.clave || "");
      const site = writeStore(root, body.site || defaultSite());
      sendJson(res, 200, { ok: true, site });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    sendJson(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en contenido del sitio.",
    });
  }
}

export function createPolisurSiteVitePlugin(rootDir) {
  return {
    name: "polisur-site",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/polisur-site")) {
          next();
          return;
        }
        await handlePolisurSiteRequest(req, res, { root: rootDir });
      });
    },
  };
}
