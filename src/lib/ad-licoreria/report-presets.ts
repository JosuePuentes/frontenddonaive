/** Presets de período para reportes A&D (derivados; sin datos inventados). */

export type AdReportPreset =
  | "hoy"
  | "ayer"
  | "semana"
  | "semana_anterior"
  | "mes"
  | "mes_anterior"
  | "anio"
  | "anio_anterior"
  | "personalizado";

export const AD_REPORT_PRESET_LABELS: Record<AdReportPreset, string> = {
  hoy: "Hoy",
  ayer: "Ayer",
  semana: "Esta semana",
  semana_anterior: "Semana anterior",
  mes: "Este mes",
  mes_anterior: "Mes anterior",
  anio: "Este año",
  anio_anterior: "Año anterior",
  personalizado: "Rango personalizado",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lunes=0
  x.setDate(x.getDate() - day);
  return x;
}

/** Devuelve { from, to } inclusivos (YYYY-MM-DD). Personalizado → vacío. */
export function rangeForPreset(
  preset: AdReportPreset,
  now = new Date(),
): { from: string; to: string } {
  const today = isoDate(now);
  if (preset === "hoy") return { from: today, to: today };
  if (preset === "ayer") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const s = isoDate(y);
    return { from: s, to: s };
  }
  if (preset === "semana") {
    const start = startOfWeek(now);
    return { from: isoDate(start), to: today };
  }
  if (preset === "semana_anterior") {
    const startThis = startOfWeek(now);
    const endPrev = new Date(startThis);
    endPrev.setDate(endPrev.getDate() - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(startPrev.getDate() - 6);
    return { from: isoDate(startPrev), to: isoDate(endPrev) };
  }
  if (preset === "mes") {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: today,
    };
  }
  if (preset === "mes_anterior") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (preset === "anio") {
    return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to: today };
  }
  if (preset === "anio_anterior") {
    const y = now.getFullYear() - 1;
    return {
      from: isoDate(new Date(y, 0, 1)),
      to: isoDate(new Date(y, 11, 31)),
    };
  }
  return { from: "", to: "" };
}

export function inDateRange(
  iso: string,
  from: string,
  to: string,
): boolean {
  const d = iso.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}
