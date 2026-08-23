import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  activateLicense,
  clearLicense,
  loadLicense,
  type DsLicense,
} from "@/lib/donaive-software/license";
import {
  loadProducts,
  loadRates,
  receiveStock,
  saveProducts,
  saveRates,
  type DsProductDemo,
  type DsRatesState,
} from "@/lib/donaive-software/store";

type Ctx = {
  license: DsLicense | null;
  rates: DsRatesState;
  products: DsProductDemo[];
  activate: (businessName: string, licenseKey?: string) => void;
  deactivate: () => void;
  setBcv: (rate: number) => void;
  setProtectedRate: (rate: number) => void;
  applyPurchaseCpp: (
    productId: string,
    qtyBase: number,
    unitCostUsd: number,
  ) => void;
};

const DonaiveSoftwareContext = createContext<Ctx | null>(null);

export function DonaiveSoftwareProvider({ children }: { children: ReactNode }) {
  const [license, setLicense] = useState<DsLicense | null>(null);
  const [rates, setRates] = useState<DsRatesState>(() => loadRates());
  const [products, setProducts] = useState<DsProductDemo[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLicense(loadLicense());
    setRates(loadRates());
    setProducts(loadProducts());
    setReady(true);
  }, []);

  const activate = useCallback((businessName: string, licenseKey?: string) => {
    const next = activateLicense({ businessName, licenseKey });
    setLicense(next);
  }, []);

  const deactivate = useCallback(() => {
    clearLicense();
    setLicense(null);
  }, []);

  const setBcv = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        bcv: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const setProtectedRate = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        protectedRate: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const applyPurchaseCpp = useCallback(
    (productId: string, qtyBase: number, unitCostUsd: number) => {
      setProducts((prev) => {
        const next = receiveStock(prev, productId, qtyBase, unitCostUsd);
        saveProducts(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      license,
      rates,
      products,
      activate,
      deactivate,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
    }),
    [
      license,
      rates,
      products,
      activate,
      deactivate,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
    ],
  );

  if (!ready) return null;

  return (
    <DonaiveSoftwareContext.Provider value={value}>
      {children}
    </DonaiveSoftwareContext.Provider>
  );
}

export function useDonaiveSoftware() {
  const ctx = useContext(DonaiveSoftwareContext);
  if (!ctx) {
    throw new Error("useDonaiveSoftware debe usarse dentro del provider");
  }
  return ctx;
}
