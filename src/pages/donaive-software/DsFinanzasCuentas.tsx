import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsFinanzasCuentas() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsPlaceholder
      title="Cuentas"
      modulePath={r.finanzas}
      moduleLabel="Finanzas"
      blurb="Cuentas por cobrar y pagar del negocio."
    />
  );
}
