/** Cliente HTTP para activación remota de Donaive Software. */

import { getDeviceFingerprint, getDeviceLabel } from "@/lib/donaive-software/device";

const BASE = "/api/ds-licenses";

async function postJson<T>(
  action: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as T & { ok?: boolean; error?: string };
  if (!res.ok || payload.ok === false) {
    throw new Error(
      (payload as { error?: string }).error ||
        "No se pudo completar la operación de licencia.",
    );
  }
  return payload;
}

export type DsActivationRequest = {
  id: string;
  requestCode: string;
  deviceFingerprint: string;
  deviceLabel: string;
  status: "pending" | "approved" | "rejected";
  licenseId: string | null;
  createdAt: string;
  approvedAt?: string;
};

export type DsRedeemResult = {
  ok: true;
  alreadyActive?: boolean;
  businessName: string;
  licenseId: string;
  activationId: string;
};

export async function requestRemoteActivation(): Promise<DsActivationRequest> {
  const payload = await postJson<{ request: DsActivationRequest }>(
    "requestActivation",
    {
      deviceFingerprint: getDeviceFingerprint(),
      deviceLabel: getDeviceLabel(),
    },
  );
  return payload.request;
}

export async function redeemActivationCode(
  activationCode: string,
): Promise<DsRedeemResult> {
  return postJson<DsRedeemResult>("redeemCode", {
    activationCode,
    deviceFingerprint: getDeviceFingerprint(),
    deviceLabel: getDeviceLabel(),
  });
}

export async function checkRemoteActivation(input: {
  activationId: string;
}): Promise<
  | { ok: true; businessName: string; licenseId: string }
  | { ok: false; reason: string }
> {
  const res = await fetch(`${BASE}?action=checkDevice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      activationId: input.activationId,
      deviceFingerprint: getDeviceFingerprint(),
    }),
  });
  const payload = (await res.json()) as {
    ok: boolean;
    reason?: string;
    license?: { id: string; businessName: string };
  };
  if (!payload.ok) {
    return { ok: false, reason: payload.reason || "invalid" };
  }
  return {
    ok: true,
    businessName: payload.license!.businessName,
    licenseId: payload.license!.id,
  };
}

export type DsLicenseStore = {
  licenses: Array<{
    id: string;
    businessName: string;
    maxDevices: number;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  requests: Array<{
    id: string;
    requestCode: string;
    deviceFingerprint: string;
    deviceLabel: string;
    status: string;
    licenseId: string | null;
    createdAt: string;
    approvedAt?: string;
    activationCodeId?: string;
  }>;
  codes: Array<{
    id: string;
    code: string;
    licenseId: string;
    status: string;
    createdAt: string;
    usedAt?: string;
  }>;
  activations: Array<{
    id: string;
    licenseId: string;
    deviceFingerprint: string;
    deviceLabel: string;
    activatedAt: string;
    revoked?: boolean;
  }>;
};

async function adminPost(
  action: string,
  clave: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${BASE}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ds-Admin-Clave": clave,
    },
    body: JSON.stringify({ ...body, clave }),
  });
  const payload = (await res.json()) as {
    ok?: boolean;
    error?: string;
    store?: DsLicenseStore;
    activationCode?: string | null;
  };
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.error || "Error en panel de activación.");
  }
  return payload;
}

export async function fetchLicenseStore(clave: string): Promise<DsLicenseStore> {
  const res = await fetch(
    `${BASE}?action=list&clave=${encodeURIComponent(clave)}`,
  );
  const payload = (await res.json()) as {
    ok?: boolean;
    error?: string;
    store?: DsLicenseStore;
  };
  if (!res.ok || !payload.store) {
    throw new Error(payload.error || "No se pudo cargar licencias.");
  }
  return payload.store;
}

export async function adminCreateLicense(
  clave: string,
  input: { businessName: string; maxDevices: number; notes?: string },
) {
  return adminPost("createLicense", clave, input);
}

export async function adminApproveRequest(
  clave: string,
  input: { requestId: string; licenseId: string },
) {
  return adminPost("approveRequest", clave, input);
}

export async function adminRejectRequest(
  clave: string,
  input: { requestId: string },
) {
  return adminPost("rejectRequest", clave, input);
}

export async function adminGenerateCode(
  clave: string,
  input: { licenseId: string },
) {
  return adminPost("generateCode", clave, input);
}

export async function adminRevokeActivation(
  clave: string,
  input: { activationId: string },
) {
  return adminPost("revokeActivation", clave, input);
}

export async function adminSuspendLicense(
  clave: string,
  input: { licenseId: string },
) {
  return adminPost("suspendLicense", clave, input);
}
