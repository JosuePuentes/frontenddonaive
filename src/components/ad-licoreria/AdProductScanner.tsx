/**
 * Buscador / escáner de productos A&D.
 * Cámara opcional (BarcodeDetector / getUserMedia); fallback manual siempre disponible.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";

type Hit = {
  id: string;
  name: string;
  brand?: string | null;
  sku?: string | null;
  presentations?: { id: string; name: string; unitsPerPresentation: number }[];
};

type Props = {
  onSelect?: (product: Hit) => void;
  placeholder?: string;
};

export function AdProductScanner(props: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [msg, setMsg] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<number | null>(null);

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    setCameraSupported(ok);
    return () => {
      stopCamera();
    };
  }, []);

  const search = useCallback(async (term: string, source: "manual" | "camera" | "wedge" = "manual") => {
    const t = term.trim();
    if (!t) {
      setHits([]);
      return;
    }
    if (!isAdApiDataSource()) {
      setMsg("Búsqueda API requiere VITE_AD_DATA_SOURCE=api");
      return;
    }
    const byCode = await adCommerceClient.lookupByCode(t, source);
    if (byCode.ok && byCode.data) {
      const row = byCode.data as Hit;
      setHits([row]);
      props.onSelect?.(row);
      return;
    }
    const r = await adCommerceClient.searchProducts(t);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setHits(r.data as Hit[]);
    setMsg("");
  }, [props]);

  function stopCamera() {
    if (scanTimer.current) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    if (!cameraSupported) {
      setMsg("Cámara no disponible en este dispositivo/navegador. Use búsqueda manual.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      await new Promise((r) => setTimeout(r, 50));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;
      if (!Detector) {
        setMsg(
          "Cámara activa, pero BarcodeDetector no está en este navegador. Digite el código manualmente.",
        );
        return;
      }
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "code_128", "qr_code", "upc_a"],
      });
      scanTimer.current = window.setInterval(() => {
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;
        void detector.detect(v).then((codes) => {
          const raw = codes[0]?.rawValue;
          if (raw) {
            setQ(raw);
            void search(raw, "camera");
            stopCamera();
          }
        });
      }, 700);
    } catch {
      setMsg("No se pudo abrir la cámara. Continúe con búsqueda manual.");
      stopCamera();
    }
  }

  return (
    <div className="ad-panel space-y-3">
      <h2 className="font-medium">Buscar / escanear producto</h2>
      <div className="flex flex-wrap gap-2">
        <input
          className="ad-input min-w-[12rem] flex-1"
          placeholder={
            props.placeholder ??
            "Código, barcode, nombre, marca, presentación…"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void search(q, "wedge");
          }}
        />
        <button type="button" className="ad-btn" onClick={() => void search(q)}>
          Buscar
        </button>
        {cameraSupported ? (
          <button
            type="button"
            className="ad-btn"
            onClick={() => (cameraOn ? stopCamera() : void startCamera())}
          >
            {cameraOn ? "Cerrar cámara" : "Escanear cámara"}
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
      {msg ? <p className="text-sm text-[var(--ad-muted)]">{msg}</p> : null}
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
    </div>
  );
}
