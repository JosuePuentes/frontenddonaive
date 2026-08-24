import {
  approveRequest,
  assertAdminClave,
  checkDeviceActivation,
  createActivationRequest,
  createLicense,
  createPresidentUser,
  deactivatePresidentUser,
  findApprovedUnusedCodeForRequest,
  generateStandaloneCode,
  getLatestRequestForDevice,
  getPendingRequestForDevice,
  mutateStore,
  presidentLogin,
  readJsonBody,
  readStore,
  redeemActivationCode,
  rejectRequest,
  revokeActivation,
  sendJson,
  suspendLicense,
} from "./lib/ds-licenses-core.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Ds-Admin-Clave",
  );
}

function adminClaveFrom(req, url, body = {}) {
  return (
    body.clave ||
    url.searchParams.get("clave") ||
    req.headers["x-ds-admin-clave"] ||
    ""
  );
}

export async function handleDsLicensesRequest(req, res, opts) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const root = opts.root;
  const mode = opts.mode || "local";
  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "list";

  try {
    if (req.method === "POST" && action === "requestActivation") {
      const body = await readJsonBody(req);
      const store = await mutateStore(
        mode,
        root,
        (current) => createActivationRequest(current, body),
        "ds-licenses: solicitud de activación",
      );
      const pending =
        getPendingRequestForDevice(store, body.deviceFingerprint) ||
        getLatestRequestForDevice(store, body.deviceFingerprint);
      sendJson(res, 200, {
        ok: true,
        request: pending,
      });
      return;
    }

    if (req.method === "POST" && action === "redeemCode") {
      const body = await readJsonBody(req);
      let result;
      await mutateStore(
        mode,
        root,
        (current) => {
          const out = redeemActivationCode(current, body);
          result = out.result;
          return out.store;
        },
        "ds-licenses: canje de código",
      );
      sendJson(res, 200, {
        ok: true,
        ...result,
        businessName: result.license.businessName,
        licenseId: result.license.id,
        activationId: result.activation.id,
      });
      return;
    }

    if (req.method === "POST" && action === "checkDevice") {
      const body = await readJsonBody(req);
      const store = await readStore(mode, root);
      const check = checkDeviceActivation(store, body);
      sendJson(res, 200, check);
      return;
    }

    if (req.method === "GET" && action === "list") {
      const clave = adminClaveFrom(req, url);
      assertAdminClave(clave);
      const store = await readStore(mode, root);
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "createLicense") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => createLicense(current, body),
        "ds-licenses: crear licencia",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "approveRequest") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      let approvedCode = null;
      const store = await mutateStore(
        mode,
        root,
        (current) => {
          const next = approveRequest(current, body);
          approvedCode = findApprovedUnusedCodeForRequest(next, body.requestId);
          return next;
        },
        "ds-licenses: aprobar solicitud",
      );
      sendJson(res, 200, {
        ok: true,
        store,
        activationCode: approvedCode?.code || null,
      });
      return;
    }

    if (req.method === "POST" && action === "rejectRequest") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => rejectRequest(current, body),
        "ds-licenses: rechazar solicitud",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "generateCode") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      let generated = null;
      const store = await mutateStore(
        mode,
        root,
        (current) => {
          const out = generateStandaloneCode(current, body);
          generated = out.code;
          return out.store;
        },
        "ds-licenses: generar código",
      );
      sendJson(res, 200, {
        ok: true,
        store,
        activationCode: generated?.code || null,
      });
      return;
    }

    if (req.method === "POST" && action === "revokeActivation") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => revokeActivation(current, body),
        "ds-licenses: revocar equipo",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "suspendLicense") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => suspendLicense(current, body),
        "ds-licenses: suspender licencia",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "createPresidentUser") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => createPresidentUser(current, body),
        "ds-licenses: crear usuario presidente",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "deactivatePresidentUser") {
      const body = await readJsonBody(req);
      assertAdminClave(adminClaveFrom(req, url, body));
      const store = await mutateStore(
        mode,
        root,
        (current) => deactivatePresidentUser(current, body),
        "ds-licenses: desactivar presidente",
      );
      sendJson(res, 200, { ok: true, store });
      return;
    }

    if (req.method === "POST" && action === "presidentLogin") {
      const body = await readJsonBody(req);
      const store = await readStore(mode, root);
      const result = presidentLogin(store, body);
      if (!result.ok) {
        sendJson(res, 401, result);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    sendJson(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en licencias Donaive Software.",
    });
  }
}

export function createDsLicensesVitePlugin(rootDir) {
  return {
    name: "ds-licenses",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/ds-licenses")) {
          next();
          return;
        }
        await handleDsLicensesRequest(req, res, {
          root: rootDir,
          mode: "local",
        });
      });
    },
  };
}
