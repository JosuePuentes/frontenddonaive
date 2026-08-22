export const POLISUR_UNITS = [
  { id: "institucion", label: "POLISUR — Institución" },
  { id: "unidad-canina", label: "Unidad Canina" },
  { id: "unidades-operativas", label: "Unidades operativas" },
  { id: "prevencion", label: "Prevención y cercanía" },
] as const;

export type PolisurUnitId = (typeof POLISUR_UNITS)[number]["id"] | string;

export const POLISUR_UNIT_IDS = POLISUR_UNITS.map((unit) => unit.id);

export function polisurUnitLabel(
  id: string,
  units?: { id: string; label: string }[],
) {
  const fromDynamic = units?.find((unit) => unit.id === id)?.label;
  if (fromDynamic) return fromDynamic;
  return POLISUR_UNITS.find((unit) => unit.id === id)?.label ?? id;
}

export function unitFromSearchParam(value: string | null): string {
  if (value === "canina") return "unidad-canina";
  if (value && value.trim()) return value.trim();
  return "institucion";
}

export const POLISUR_SESSION_KEY = "polisur-medios-session-v1";
