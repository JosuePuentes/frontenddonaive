import { useEffect, useState } from "react";
import { applyPwaUpdate } from "@/lib/pwa";

/** Banner de red + aviso de actualización PWA. */
export function DsPwaStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    function onNeed() {
      setNeedRefresh(true);
    }
    window.addEventListener("ds-pwa-need-refresh", onNeed);
    return () => window.removeEventListener("ds-pwa-need-refresh", onNeed);
  }, []);

  if (online && !needRefresh) return null;

  return (
    <div className="ds-pwa-stack" aria-live="polite">
      {!online ? (
        <div className="ds-pwa-banner ds-pwa-banner--offline">
          Sin conexión · trabajando con datos locales de este equipo
        </div>
      ) : null}
      {needRefresh ? (
        <div className="ds-pwa-banner ds-pwa-banner--update">
          <span>Hay una versión nueva de Donaive Software</span>
          <button
            type="button"
            className="ds-btn ds-btn--primary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => {
              applyPwaUpdate();
              setNeedRefresh(false);
            }}
          >
            Actualizar
          </button>
        </div>
      ) : null}
    </div>
  );
}
