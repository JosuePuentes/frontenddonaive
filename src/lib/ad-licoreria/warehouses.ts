/** Depósitos canónicos A&D (IDs estables; el nombre lo define el usuario). */
export const AD_WH_BODEGON = "wh-1";
export const AD_WH_LICORERIA = "wh-2";

/** Etiquetas por defecto si aún no hay catálogo cargado. */
export const AD_WAREHOUSE_DEFAULT_LABELS: Record<string, string> = {
  [AD_WH_BODEGON]: "Bodegón",
  [AD_WH_LICORERIA]: "Licorería",
};

export function warehouseLabel(
  id: string,
  warehouses?: { id: string; name: string }[],
): string {
  const fromList = warehouses?.find((w) => w.id === id)?.name;
  if (fromList) return fromList;
  return AD_WAREHOUSE_DEFAULT_LABELS[id] ?? id;
}
