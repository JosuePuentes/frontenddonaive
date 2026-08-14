export const POLISUR_UNITS = [
  { id: "institucion", label: "POLISUR — Institución" },
  { id: "unidad-canina", label: "Unidad Canina" },
  { id: "unidades-operativas", label: "Unidades operativas" },
  { id: "prevencion", label: "Prevención y cercanía" },
] as const;

export type PolisurUnitId = (typeof POLISUR_UNITS)[number]["id"];

export const POLISUR_UNIT_IDS = POLISUR_UNITS.map((unit) => unit.id);

export function polisurUnitLabel(id: string) {
  return POLISUR_UNITS.find((unit) => unit.id === id)?.label ?? id;
}

export function unitFromSearchParam(value: string | null): PolisurUnitId {
  if (value === "canina") return "unidad-canina";
  if (POLISUR_UNIT_IDS.includes(value as PolisurUnitId)) {
    return value as PolisurUnitId;
  }
  return "institucion";
}

export const POLISUR_SESSION_KEY = "polisur-medios-session-v1";
