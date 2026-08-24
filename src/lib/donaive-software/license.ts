/** Licencia local del negocio (offline-first, validada remotamente al activar). */

export type DsLicense = {
  businessName: string;
  activatedAt: string;
  active: boolean;
  /** ID de licencia en servidor Donaive. */
  licenseId: string;
  /** Activación de este equipo. */
  activationId: string;
  deviceFingerprint: string;
};

const STORAGE_KEY = "donaive-software-license-v1";

export function loadLicense(): DsLicense | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DsLicense;
    if (
      !parsed?.businessName ||
      !parsed.active ||
      !parsed.licenseId ||
      !parsed.activationId
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLicense(license: DsLicense): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
}

export function clearLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function activateLicenseFromServer(input: {
  businessName: string;
  licenseId: string;
  activationId: string;
  deviceFingerprint: string;
}): DsLicense {
  const license: DsLicense = {
    businessName: input.businessName.trim(),
    licenseId: input.licenseId,
    activationId: input.activationId,
    deviceFingerprint: input.deviceFingerprint,
    activatedAt: new Date().toISOString(),
    active: true,
  };
  saveLicense(license);
  return license;
}
