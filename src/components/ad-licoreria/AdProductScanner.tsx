/**
 * Buscador / escáner de productos A&D.
 * Cámara opcional (BarcodeDetector / getUserMedia); fallback manual siempre disponible.
 */
import { useCallback, useState } from "react";
import { useAdBarcodeCamera } from "@/hooks/ad-licoreria/useAdBarcodeCamera";
import {
  searchAdProducts,
  type AdProductSearchHit,
} from "@/lib/ad-licoreria/product-lookup";

export type { AdProductSearchHit };

type Props = {
  onSelect?: (product: AdProductSearchHit) => void;
  placeholder?: string;
  variant?: "panel" | "inline";
  /** Si hay un solo resultado por código, dispara onSelect automáticamente */
  autoSelectSingle?: boolean;
  className?: string;
};

export function AdProductScanner(props: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<AdProductSearchHit[]>([]);
  const [msg, setMsg] = useState("");
  const variant = props.variant ?? "panel";

  const search = useCallback(
    async (term: string, source: "manual" | "camera" | "wedge" = "manual") => {
      const t = term.trim();
      if (!t) {
        setHits([]);
        return;
      }
      const r = await searchAdProducts(t, source);
      if (!r.ok) {
        setMsg(r.error);
        setHits([]);
        return;
      }
      setHits(r.products);
      setMsg(r.products.length ? "" : "Sin resultados");
      if (
        props.autoSelectSingle !== false &&
        r.fromCode &&
        r.products.length === 1
      ) {
        props.onSelect?.(r.products[0]);
      }
    },
    [props.autoSelectSingle, props.onSelect],
  );

  const { cameraOn, cameraSupported, msg: camMsg, videoRef, toggleCamera } =
    useAdBarcodeCamera({
      onScan: (code) => {
        setQ(code);
        void search(code, "camera");
      },
    });

  const displayMsg = msg || camMsg;

  const field = (
    <>
      <div className="flex flex-wrap gap-2">
        <input
          className="ad-input min-w-[12rem] flex-1"
          placeholder={
            props.placeholder ??
            "Código, barcode, nombre, marca, presentación… (Enter)"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void search(q, "wedge");
          }}
          autoComplete="off"
        />
        <button type="button" className="ad-btn" onClick={() => void search(q)}>
          Buscar
        </button>
        {cameraSupported ? (
          <button type="button" className="ad-btn" onClick={toggleCamera}>
            {cameraOn ? "Cerrar cámara" : "Escanear"}
          </button>
        ) : null}
      </div>
      {cameraOn ? (
        <video
          ref={videoRef}
          className="max-h-48 w-full rounded bg-black object-cover"
          muted
          playsInline
        />
      ) : null}
    </>
  );

  const hitList = hits.length ? (
    <ul className="space-y-1 text-sm">
      {hits.map((h) => (
        <li key={h.id}>
          <button
            type="button"
            className="w-full rounded px-2 py-1 text-left hover:bg-white/5"
            onClick={() => props.onSelect?.(h)}
          >
            <span className="font-medium">{h.name}</span>
            {h.brand ? (
              <span className="text-[var(--ad-muted)]"> · {h.brand}</span>
            ) : null}
            {h.sku ? (
              <span className="text-[var(--ad-muted)]"> · {h.sku}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  if (variant === "inline") {
    return (
      <div className={props.className ?? "space-y-2"}>
        {field}
        {displayMsg ? (
          <p className="text-sm text-[var(--ad-muted)]">{displayMsg}</p>
        ) : null}
        {hitList}
      </div>
    );
  }

  return (
    <div className={`ad-panel space-y-3 ${props.className ?? ""}`}>
      <h2 className="font-medium">Buscar / escanear producto</h2>
      {field}
      {displayMsg ? (
        <p className="text-sm text-[var(--ad-muted)]">{displayMsg}</p>
      ) : null}
      {hitList}
    </div>
  );
}
