import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsPosCierres() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsPlaceholder
      title="Cierres"
      modulePath={r.pos}
      moduleLabel="Punto de venta"
      blurb="Cierre de turno y cuadre de caja por método de pago."
    />
  );
}
