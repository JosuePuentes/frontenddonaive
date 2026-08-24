/**
 * Licencias Donaive Software — activación por código de un solo uso.
 *
 * POST action=requestActivation  — público (solicitud desde equipo)
 * POST action=redeemCode         — público (canjear código)
 * POST action=checkDevice        — público (validar activación vigente)
 * GET  action=list               — admin
 * POST action=createLicense      — admin
 * POST action=approveRequest       — admin (asigna licencia + genera código)
 * POST action=rejectRequest        — admin
 * POST action=generateCode         — admin (código suelto para una licencia)
 * POST action=revokeActivation     — admin
 * POST action=suspendLicense       — admin
 *
 * Secrets: DONAIVE_SOFTWARE_ADMIN_CLAVE (o POLISUR_MEDIOS_CLAVE), GITHUB_TOKEN
 */

import { handleDsLicensesRequest } from "../scripts/ds-licenses-handler.mjs";
import { resolve } from "node:path";

export default async function handler(req, res) {
  await handleDsLicensesRequest(req, res, {
    root: resolve(process.cwd()),
    mode: "github",
  });
}
