/**
 * Resolución de períodos para Dashboard F8 (timezone del tenant).
 */
import { todayPeriodBounds } from "./availability.js";

export type DashboardPreset =
  | "hoy"
  | "ayer"
  | "semana"
  | "semana_anterior"
  | "mes"
  | "mes_anterior"
  | "anio"
  | "anio_anterior"
  | "personalizado";

function dateKeyInTz(timezone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** [from 00:00Z, toExclusive) a partir de YYYY-MM-DD inclusivos. */
export function boundsFromInclusiveDates(
  fromDate: string,
  toDateInclusive: string,
): { from: Date; to: Date } {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDateInclusive}T00:00:00.000Z`);
  const to = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function resolveDashboardPeriod(input: {
  timezone: string;
  preset?: DashboardPreset;
  from?: string;
  to?: string;
  now?: Date;
}): {
  preset: DashboardPreset;
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
  previousFrom: Date;
  previousTo: Date;
  previousFromDate: string;
  previousToDate: string;
  timezone: string;
} {
  const now = input.now ?? new Date();
  const timezone = input.timezone || "America/Caracas";
  const today = dateKeyInTz(timezone, now);
  let preset: DashboardPreset = input.preset ?? "hoy";
  let fromDate: string;
  let toDate: string;

  if (preset === "personalizado") {
    if (!input.from || !input.to) {
      throw new Error("Período personalizado requiere from y to");
    }
    fromDate = input.from.slice(0, 10);
    toDate = input.to.slice(0, 10);
  } else if (preset === "hoy") {
    fromDate = today;
    toDate = today;
  } else if (preset === "ayer") {
    fromDate = addDays(today, -1);
    toDate = fromDate;
  } else if (preset === "semana") {
    fromDate = startOfWeekMonday(today);
    toDate = today;
  } else if (preset === "semana_anterior") {
    const startThis = startOfWeekMonday(today);
    toDate = addDays(startThis, -1);
    fromDate = addDays(toDate, -6);
  } else if (preset === "mes") {
    fromDate = `${today.slice(0, 7)}-01`;
    toDate = today;
  } else if (preset === "mes_anterior") {
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    fromDate = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
    toDate = `${prevY}-${String(prevM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  } else if (preset === "anio") {
    fromDate = `${today.slice(0, 4)}-01-01`;
    toDate = today;
  } else if (preset === "anio_anterior") {
    const y = Number(today.slice(0, 4)) - 1;
    fromDate = `${y}-01-01`;
    toDate = `${y}-12-31`;
  } else {
    const b = todayPeriodBounds(timezone, now);
    fromDate = b.dateKey;
    toDate = b.dateKey;
    preset = "hoy";
  }

  const { from, to } = boundsFromInclusiveDates(fromDate, toDate);
  const days =
    Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) || 1;
  const previousToDate = addDays(fromDate, -1);
  const previousFromDate = addDays(previousToDate, -(days - 1));
  const prev = boundsFromInclusiveDates(previousFromDate, previousToDate);

  return {
    preset,
    from,
    to,
    fromDate,
    toDate,
    previousFrom: prev.from,
    previousTo: prev.to,
    previousFromDate,
    previousToDate,
    timezone,
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
