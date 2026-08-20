/** Depósitos canónicos A&D (IDs mock; en API se resuelven por código LIC/BOD). */
export const AD_WH_BODEGON = "wh-1";
export const AD_WH_LICORERIA = "wh-2";

/** Etiquetas por defecto si aún no hay catálogo cargado. */
export const AD_WAREHOUSE_DEFAULT_LABELS: Record<string, string> = {
  [AD_WH_BODEGON]: "Bodegón",
  [AD_WH_LICORERIA]: "Licorería",
};

export type AdWarehouseRef = {
  id: string;
  name: string;
  code?: string;
};

export function warehouseLabel(
  id: string,
  warehouses?: { id: string; name: string }[],
): string {
  const fromList = warehouses?.find((w) => w.id === id)?.name;
  if (fromList) return fromList;
  return AD_WAREHOUSE_DEFAULT_LABELS[id] ?? id;
}

/** UUID real del depósito (API) o ID mock si el catálogo aún no cargó. */
export function resolveCanonicalWarehouseId(
  kind: "LIC" | "BOD",
  warehouses: AdWarehouseRef[] = [],
): string {
  const want = kind.toUpperCase();
  const found = warehouses.find(
    (w) => (w.code ?? "").toUpperCase() === want,
  );
  if (found?.id) return found.id;
  return kind === "LIC" ? AD_WH_LICORERIA : AD_WH_BODEGON;
}

/** El bodegón usa mesas/espacios; la licorería vende directo en mostrador. */
export function warehouseUsesMesas(
  warehouseId: string,
  warehouses: AdWarehouseRef[] = [],
): boolean {
  if (!warehouseId) return false;
  const wh = warehouses.find((w) => w.id === warehouseId);
  const code = (wh?.code ?? "").toUpperCase();
  if (code === "LIC") return false;
  if (code === "BOD") return true;
  if (warehouseId === AD_WH_LICORERIA) return false;
  if (warehouseId === AD_WH_BODEGON) return true;
  return false;
}
