/**
 * Vercel limita el cuerpo de las funciones (~4,5 MB). Las subidas van en JSON + base64,
 * así que reducimos tamaño en el navegador antes del POST.
 */
const VERCEL_SAFE_JSON_BYTES = 4 * 1024 * 1024;

type PrepareOptions = {
  /** Ruta destino en repo (p. ej. public/polisur/home/hero.jpg) */
  destPath?: string;
  /** Longitud aproximada de la clave en el JSON (margen en la estimación). */
  claveLength?: number;
};

function estimateUploadJsonBytes(
  dataUrl: string,
  path: string,
  claveLength: number,
): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const sample = JSON.stringify({
    clave: "0".repeat(Math.max(claveLength, 8)),
    path,
    dataBase64: base64,
  });
  return new Blob([sample]).size;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo abrir la imagen."));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo preparar la imagen.")),
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(blob);
  });
}

function preferPngOutput(destPath?: string, fileType?: string): boolean {
  if (destPath?.toLowerCase().endsWith(".png")) return true;
  return fileType === "image/png";
}

/**
 * Devuelve un data URL listo para `dataBase64` en la API de medios.
 */
export async function preparePolisurUploadDataUrl(
  file: File,
  options: PrepareOptions = {},
): Promise<{ dataUrl: string; optimized: boolean }> {
  const destPath = options.destPath ?? "public/polisur/extras/upload.jpg";
  const claveLength = options.claveLength ?? 24;
  const wantPng = preferPngOutput(destPath, file.type);

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });

  if (
    estimateUploadJsonBytes(rawDataUrl, destPath, claveLength) <=
    VERCEL_SAFE_JSON_BYTES
  ) {
    return { dataUrl: rawDataUrl, optimized: false };
  }

  const img = await loadImage(file);
  const edges = [2400, 1920, 1600, 1280, 1024, 800];
  const qualities = [0.92, 0.85, 0.78, 0.7, 0.62, 0.55];

  for (const maxEdge of edges) {
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");
    ctx.drawImage(img, 0, 0, w, h);

    if (wantPng) {
      const blob = await canvasToBlob(canvas, "image/png");
      const dataUrl = await blobToDataUrl(blob);
      if (
        estimateUploadJsonBytes(dataUrl, destPath, claveLength) <=
        VERCEL_SAFE_JSON_BYTES
      ) {
        return { dataUrl, optimized: true };
      }
      continue;
    }

    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, "image/jpeg", q);
      const dataUrl = await blobToDataUrl(blob);
      if (
        estimateUploadJsonBytes(dataUrl, destPath, claveLength) <=
        VERCEL_SAFE_JSON_BYTES
      ) {
        return { dataUrl, optimized: true };
      }
    }
  }

  throw new Error(
    "La imagen sigue siendo demasiado pesada tras optimizarla. Use una foto más pequeña o recorte la imagen.",
  );
}
