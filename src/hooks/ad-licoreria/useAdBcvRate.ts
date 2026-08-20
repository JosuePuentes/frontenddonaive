import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

/** Tasa BCV para mostrar $ + Bs. Usa settings hidratados o consulta /rates/bcv. */
export function useAdBcvRate(): number {
  const { settings } = useAdLicoreria();
  const fromSettings = Number(settings.exchangeRateUsdToBs) || 0;
  const [rate, setRate] = useState(fromSettings);

  useEffect(() => {
    if (fromSettings > 0) {
      setRate(fromSettings);
      return;
    }
    void adCommerceClient.getBcv().then((r) => {
      if (!r.ok) return;
      const d = r.data as { current?: { rate: number } };
      if (d.current?.rate) setRate(d.current.rate);
    });
  }, [fromSettings]);

  return rate > 0 ? rate : fromSettings;
}
