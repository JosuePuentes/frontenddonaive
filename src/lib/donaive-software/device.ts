/** Huella estable del equipo para activación de licencia. */

const DEVICE_ID_KEY = "donaive-software-device-id-v1";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Equipo desconocido";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  let browser = "Navegador";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";
  return `${browser} · ${platform || "Web"}`.slice(0, 160);
}
