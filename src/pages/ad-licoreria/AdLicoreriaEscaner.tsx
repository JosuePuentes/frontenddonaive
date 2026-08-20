import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import { useAdBarcodeCamera } from "@/hooks/ad-licoreria/useAdBarcodeCamera";
import { formatAdPrice, fromBaseUnits } from "@/lib/ad-licoreria/conversions";
import {
  resolveAdProductByCode,
  type AdProductSearchHit,
} from "@/lib/ad-licoreria/product-lookup";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

type ScanView =
  | { mode: "idle" }
  | {
      mode: "result";
      code: string;
      productId: string;
      presentationId?: string;
      apiHit?: AdProductSearchHit;
    };

/**
 * Visor dedicado de escaneo: lee códigos y muestra ficha del producto
 * (nombre, precios, existencias) sin mezclarlo con el flujo del POS.
 */
export default function AdLicoreriaEscaner() {
  const routes = getAdLicoreriaRoutes();
  const {
    products,
    presentations,
    warehouses,
    getPresentationsFor,
    getOperationalAvailability,
    getCurrentOperator,
  } = useAdLicoreria();

  const session = getCurrentOperator();
  const [manualCode, setManualCode] = useState("");
  const [view, setView] = useState<ScanView>({ mode: "idle" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const resolveCode = useCallback(
    async (code: string, source: "manual" | "camera" | "wedge" = "camera") => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setBusy(true);
      setMsg("");
      try {
        const hit = await resolveAdProductByCode(
          trimmed,
          { products, presentations },
          source,
        );
        if (!hit) {
          setView({ mode: "idle" });
          setMsg(`No se encontró producto para «${trimmed}»`);
          return;
        }
        const product = products.find((p) => p.id === hit.productId);
        if (product && !product.active) {
          setView({ mode: "idle" });
          setMsg("Producto no disponible");
          return;
        }
        setManualCode(trimmed);
        setView({
          mode: "result",
          code: trimmed,
          productId: hit.productId,
          presentationId: hit.presentationId,
          apiHit: hit.apiHit,
        });
      } finally {
        setBusy(false);
      }
    },
    [presentations, products],
  );

  const onCameraScan = useCallback(
    (code: string) => {
      void resolveCode(code, "camera");
    },
    [resolveCode],
  );

  const {
    cameraOn,
    cameraSupported,
    msg: camMsg,
    videoRef,
    toggleCamera,
    startCamera,
    stopCamera,
  } = useAdBarcodeCamera({
    onScan: onCameraScan,
    autoStart: true,
  });

  const result = view.mode === "result" ? view : null;

  const product = useMemo(() => {
    if (!result) return undefined;
    const local = products.find((p) => p.id === result.productId);
    if (local) return local;
    if (result.apiHit) {
      return {
        id: result.apiHit.id,
        name: result.apiHit.name,
        brand: result.apiHit.brand ?? "",
        sku: result.apiHit.sku ?? "",
        barcode: result.apiHit.barcode ?? undefined,
        active: result.apiHit.active !== false,
        baseUnitLabel: "u",
        categoryId: "cat-default",
        cost: { usd: 0, bs: 0 },
        minStockBase: 0,
        defaultUtilityPercent: result.apiHit.defaultUtilityPercent ?? 0,
        taxable: Boolean(result.apiHit.taxable),
        createdAt: new Date().toISOString(),
      };
    }
    return undefined;
  }, [products, result]);

  const presList = useMemo(() => {
    if (!result) return [];
    const local = getPresentationsFor(result.productId);
    if (local.length) return local;
    if (result.apiHit?.presentations?.length) {
      return result.apiHit.presentations.map((p) => ({
        id: p.id,
        productId: result.productId,
        name: p.name,
        unitsPerPresentation: p.unitsPerPresentation,
        barcode: p.barcode ?? undefined,
        sku: p.sku ?? undefined,
        price: {
          usd: Number(p.priceUsd ?? 0),
          bs: Number(p.priceBs ?? 0),
        },
        active: true,
      }));
    }
    return [];
  }, [getPresentationsFor, result]);

  const matchedPres = useMemo(() => {
    if (!result) return undefined;
    if (result.presentationId) {
      return presList.find((p) => p.id === result.presentationId);
    }
    return presList.find(
      (p) => p.barcode?.trim().toLowerCase() === result.code.toLowerCase(),
    );
  }, [presList, result]);

  const availability = useMemo(
    () =>
      product ? getOperationalAvailability(product.id, 0) : undefined,
    [getOperationalAvailability, product],
  );

  function scanAgain() {
    setView({ mode: "idle" });
    setMsg("");
    setManualCode("");
    stopCamera();
    void startCamera();
  }

  return (
    <div className="ad-scanner space-y-4">
      <header className="ad-panel space-y-2">
        <p className="ad-eyebrow">Inventario / consulta</p>
        <h1 className="ad-panel-title">Visor de escaneo</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          {session?.name ?? "Operador"} · Apunte la cámara al código de barras
          o QR del producto.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={routes.ventas}>
            Ir al POS
          </Link>
          {cameraSupported ? (
            <button type="button" className="ad-btn" onClick={toggleCamera}>
              {cameraOn ? "Pausar cámara" : "Reanudar cámara"}
            </button>
          ) : null}
          {result ? (
            <button type="button" className="ad-btn ad-btn--gold" onClick={scanAgain}>
              Escanear otro
            </button>
          ) : null}
        </div>
      </header>

      <section className="ad-panel ad-scanner__viewport space-y-3 p-0 overflow-hidden">
        {cameraSupported ? (
          <div className="relative bg-black">
            <video
              ref={videoRef}
              className="ad-scanner__video aspect-[4/3] w-full object-cover"
              muted
              playsInline
              autoPlay
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <div className="h-40 w-64 rounded border-2 border-[var(--ad-gold)]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            {!cameraOn ? (
              <div className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center text-sm text-[var(--ad-muted)]">
                Cámara pausada. Pulse «Reanudar cámara» o «Escanear otro».
              </div>
            ) : null}
          </div>
        ) : (
          <p className="p-4 text-sm text-[var(--ad-muted)]">
            Este dispositivo no tiene cámara. Digite el código abajo o use un
            escáner USB.
          </p>
        )}
        {camMsg ? (
          <p className="px-4 pb-2 text-sm text-[var(--ad-gold-soft)]">{camMsg}</p>
        ) : null}
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-pos__section-title">Código manual</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="ad-input min-w-[12rem] flex-1"
            placeholder="EAN, SKU o código interno…"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void resolveCode(manualCode, "manual");
            }}
            inputMode="numeric"
            autoComplete="off"
          />
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={busy || !manualCode.trim()}
            onClick={() => void resolveCode(manualCode, "manual")}
          >
            Consultar
          </button>
        </div>
        {msg ? <p className="text-sm text-[var(--ad-danger)]">{msg}</p> : null}
      </section>

      {product && result ? (
        <section className="ad-panel ad-scanner__result space-y-4">
          <div>
            <p className="ad-eyebrow">Producto encontrado</p>
            <h2 className="ad-display text-2xl text-[var(--ad-gold-soft)]">
              {product.name}
            </h2>
            <p className="text-sm text-[var(--ad-muted)]">
              {product.brand ? `${product.brand} · ` : ""}
              SKU {product.sku}
              {product.barcode ? ` · EAN ${product.barcode}` : ""}
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--ad-muted)]">
              Código leído: {result.code}
            </p>
            {matchedPres ? (
              <p className="mt-2 text-sm text-[var(--ad-gold-soft)]">
                Presentación escaneada: <strong>{matchedPres.name}</strong> ·{" "}
                {formatAdPrice(matchedPres.price)}
              </p>
            ) : null}
          </div>

          <div>
            <h3 className="ad-pos__section-title mb-2">Precios por presentación</h3>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Presentación</th>
                    <th>Código</th>
                    <th>Precio</th>
                    <th>Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {presList.map((pres) => (
                    <tr
                      key={pres.id}
                      className={
                        pres.id === matchedPres?.id
                          ? "bg-[rgba(212,175,106,0.08)]"
                          : undefined
                      }
                    >
                      <td>{pres.name}</td>
                      <td className="font-mono text-xs">
                        {pres.barcode ?? pres.sku ?? "—"}
                      </td>
                      <td>{formatAdPrice(pres.price)}</td>
                      <td>{pres.unitsPerPresentation} u.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {availability ? (
            <div>
              <h3 className="ad-pos__section-title mb-2">Existencias</h3>
              <p className="mb-2 text-sm text-[var(--ad-muted)]">
                Disponible operativo total:{" "}
                <strong>{availability.availableOperationalTotal}</strong>{" "}
                {product.baseUnitLabel}
                {availability.committedActiveTotal > 0
                  ? ` · Comprometido en cuentas: ${availability.committedActiveTotal}`
                  : ""}
              </p>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Depósito</th>
                      <th>Físico</th>
                      <th>Disponible</th>
                      <th>En unidad escaneada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availability.byWarehouse.map((wh) => {
                      const pres = matchedPres ?? presList[0];
                      const inPres = pres
                        ? fromBaseUnits(pres, wh.availableOperational)
                        : wh.availableOperational;
                      return (
                        <tr key={wh.warehouseId}>
                          <td>{warehouseLabel(wh.warehouseId, warehouses)}</td>
                          <td>
                            {wh.physical} {product.baseUnitLabel}
                          </td>
                          <td>
                            {wh.availableOperational} {product.baseUnitLabel}
                          </td>
                          <td>
                            {pres
                              ? `${inPres.toLocaleString("es-VE", {
                                  maximumFractionDigits: 2,
                                })} ${pres.name}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="ad-panel text-sm text-[var(--ad-muted)]">
          Escanee o consulte un código para ver nombre, precios y cantidades.
        </section>
      )}
    </div>
  );
}
