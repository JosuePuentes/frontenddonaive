import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

type UseAdBarcodeCameraOptions = {
  onScan: (code: string) => void;
  /** Inicia la cámara al montar el componente. */
  autoStart?: boolean;
  /** Sigue escaneando tras leer un código (por defecto se detiene). */
  continuous?: boolean;
};

type BarcodeDetectorLike = {
  detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

function getNativeBarcodeDetector():
  | (new (opts: { formats: string[] }) => BarcodeDetectorLike)
  | undefined {
  return (
    window as unknown as {
      BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
}

export function useAdBarcodeCamera({
  onScan,
  autoStart = false,
  continuous = false,
}: UseAdBarcodeCameraOptions) {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [msg, setMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<number | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const usingZxingRef = useRef(false);
  const autoStartOnceRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (scanTimer.current) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    if (!usingZxingRef.current) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    usingZxingRef.current = false;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    setCameraSupported(ok);
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const emitScan = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.code === code && now - last.at < 1800) return;
      lastScanRef.current = { code, at: now };
      onScan(code);
      if (!continuous) stopCamera();
    },
    [continuous, onScan, stopCamera],
  );

  const startNativeDetector = useCallback(
    async (video: HTMLVideoElement) => {
      const Detector = getNativeBarcodeDetector();
      if (!Detector) return false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = new Detector({
        formats: ["ean_13", "ean_8", "code_128", "qr_code", "upc_a", "upc_e"],
      });
      scanTimer.current = window.setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        void detector.detect(videoRef.current).then((codes) => {
          const raw = codes[0]?.rawValue;
          if (raw) emitScan(raw);
        });
      }, 450);
      setMsg("Apunte al código de barras…");
      return true;
    },
    [emitScan],
  );

  const startZxing = useCallback(
    async (video: HTMLVideoElement) => {
      if (!zxingReaderRef.current) {
        zxingReaderRef.current = new BrowserMultiFormatReader();
      }
      usingZxingRef.current = true;
      setMsg("Apunte al código de barras…");
      const controls = await zxingReaderRef.current.decodeFromVideoDevice(
        undefined,
        video,
        (result) => {
          if (result) emitScan(result.getText());
        },
      );
      zxingControlsRef.current = controls;
    },
    [emitScan],
  );

  const startCamera = useCallback(async () => {
    if (!cameraSupported) {
      setMsg("Cámara no disponible. Use el escáner USB o digite el código.");
      return;
    }
    try {
      setCameraOn(true);
      setMsg("");
      await new Promise((r) => setTimeout(r, 80));
      const video = videoRef.current;
      if (!video) {
        setMsg("No se pudo preparar la vista de cámara.");
        stopCamera();
        return;
      }

      const nativeStarted = await startNativeDetector(video).catch(() => false);
      if (nativeStarted) return;

      await startZxing(video);
    } catch {
      setMsg("No se pudo abrir la cámara.");
      stopCamera();
    }
  }, [cameraSupported, startNativeDetector, startZxing, stopCamera]);

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera();
    else void startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  useEffect(() => {
    if (!autoStart || !cameraSupported || autoStartOnceRef.current) return;
    autoStartOnceRef.current = true;
    void startCamera();
  }, [autoStart, cameraSupported, startCamera]);

  return {
    cameraOn,
    cameraSupported,
    msg,
    videoRef,
    toggleCamera,
    startCamera,
    stopCamera,
  };
}
