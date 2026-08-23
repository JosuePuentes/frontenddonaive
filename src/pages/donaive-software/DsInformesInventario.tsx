import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInformesInventario() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsPlaceholder
      title="Informe de inventario"
      modulePath={r.informes}
      moduleLabel="Informes"
      blurb="Valorizado a CPP y existencias por depósito."
    />
  );
}
