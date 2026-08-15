/** Depósitos canónicos A&D (mock → futuro backend). */
export const AD_WH_BODEGON = "wh-1";
export const AD_WH_LICORERIA = "wh-2";

export const AD_WAREHOUSE_LABELS: Record<string, string> = {
  [AD_WH_BODEGON]: "Bodegón",
  [AD_WH_LICORERIA]: "Licorería",
};

export function warehouseLabel(id: string): string {
  return AD_WAREHOUSE_LABELS[id] ?? id;
}
