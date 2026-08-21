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
  mergePolisurSiteContent,
  POLISUR_SITE_DEFAULTS,
  type PolisurSiteContent,
} from "@/content/polisur-site";

type PolisurSiteContextValue = {
  site: PolisurSiteContent;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSiteLocal: (site: PolisurSiteContent) => void;
};

const PolisurSiteContext = createContext<PolisurSiteContextValue | null>(null);

async function fetchSite(): Promise<PolisurSiteContent> {
  const res = await fetch("/api/polisur-site?action=get", {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let data: { ok?: boolean; site?: PolisurSiteContent; error?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error("No se pudo leer el contenido del portal.");
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "No se pudo cargar el contenido del portal.");
  }
  return mergePolisurSiteContent(data.site);
}

export function PolisurSiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<PolisurSiteContent>(POLISUR_SITE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSite(await fetchSite());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el sitio.",
      );
      setSite(POLISUR_SITE_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      site,
      loading,
      error,
      refresh,
      setSiteLocal: setSite,
    }),
    [site, loading, error, refresh],
  );

  return (
    <PolisurSiteContext.Provider value={value}>
      {children}
    </PolisurSiteContext.Provider>
  );
}

export function usePolisurSite() {
  const ctx = useContext(PolisurSiteContext);
  if (!ctx) {
    return {
      site: POLISUR_SITE_DEFAULTS,
      loading: false,
      error: null,
      refresh: async () => undefined,
      setSiteLocal: () => undefined,
    } satisfies PolisurSiteContextValue;
  }
  return ctx;
}
