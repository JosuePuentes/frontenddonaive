import { useCallback, useEffect, useRef, useState } from "react";

type UseAdBarcodeCameraOptions = {
  onScan: (code: string) => void;
};

export function useAdBarcodeCamera({ onScan }: UseAdBarcodeCameraOptions) {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [msg, setMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimer.current) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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

  const startCamera = useCallback(async () => {
    if (!cameraSupported) {
      setMsg("Cámara no disponible. Use el escáner USB o digite el código.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setMsg("");
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
          "Cámara activa sin BarcodeDetector en este navegador. Digite el código manualmente.",
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
            onScan(raw);
            stopCamera();
          }
        });
      }, 700);
    } catch {
      setMsg("No se pudo abrir la cámara.");
      stopCamera();
    }
  }, [cameraSupported, onScan, stopCamera]);

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera();
    else void startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  return {
    cameraOn,
    cameraSupported,
    msg,
    videoRef,
    toggleCamera,
    stopCamera,
  };
}
