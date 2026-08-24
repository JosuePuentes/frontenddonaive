/** Licencia local del negocio (offline-first). Persistencia en localStorage. */

export type DsLicense = {
  businessName: string;
  activatedAt: string;
  active: boolean;
  /** Código simple de activación (placeholder hasta API real). */
  licenseKey?: string;
};

const STORAGE_KEY = "donaive-software-license-v1";

export function loadLicense(): DsLicense | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DsLicense;
    if (!parsed?.businessName || !parsed.active) return null;
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

export function activateLicense(input: {
  businessName: string;
  licenseKey?: string;
}): DsLicense {
  const license: DsLicense = {
    businessName: input.businessName.trim(),
    licenseKey: input.licenseKey?.trim() || undefined,
    activatedAt: new Date().toISOString(),
    active: true,
  };
  saveLicense(license);
  return license;
}
