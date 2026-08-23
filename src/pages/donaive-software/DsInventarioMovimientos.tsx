import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInventarioMovimientos() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsPlaceholder
      title="Movimientos"
      modulePath={r.inventario}
      moduleLabel="Inventario"
      blurb="Kardex de entradas, salidas y ajustes. Las entradas alimentan el CPP."
    />
  );
}
