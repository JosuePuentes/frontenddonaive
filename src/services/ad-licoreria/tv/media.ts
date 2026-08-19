/** Límites y detección de archivos para Contenido TV (móvil suele mandar MIME vacío). */

export const MAX_TV_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TV_VIDEO_BYTES = 80 * 1024 * 1024;

const VIDEO_EXT = /\.(mp4|m4v|webm|mov|mkv|avi|3gp|3gpp)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i;

export function formatFileMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferTvMediaKind(file: File): "video" | "image" | null {
  const mime = (file.type || "").toLowerCase().trim();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (VIDEO_EXT.test(file.name)) return "video";
  if (IMAGE_EXT.test(file.name)) return "image";
  return null;
}

export function inferTvMimeType(file: File): string {
  const mime = (file.type || "").trim();
  if (mime && mime !== "application/octet-stream") return mime;
  const n = file.name.toLowerCase();
  if (n.endsWith(".mp4") || n.endsWith(".m4v")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov")) return "video/quicktime";
  if (n.endsWith(".mkv")) return "video/x-matroska";
  if (n.endsWith(".avi")) return "video/x-msvideo";
  if (n.endsWith(".3gp") || n.endsWith(".3gpp")) return "video/3gpp";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".heic") || n.endsWith(".heif")) return "image/heic";
  return mime || "application/octet-stream";
}

export function isLikelyHevcOrMov(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  return mime.includes("quicktime") || /\.mov$/i.test(file.name);
}

export function friendlyTvTitle(file: File, kind: "image" | "video"): string {
  const base = file.name.replace(/\.[^.]+$/, "").trim();
  const looksLikeId =
    !base ||
    /^[0-9A-F-]{10,}$/i.test(base) ||
    /^IMG_\d+/i.test(base) ||
    /^VID_\d+/i.test(base) ||
    base.length > 48;
  if (looksLikeId) {
    const stamp = new Date().toLocaleString("es", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return kind === "video" ? `Video ${stamp}` : `Imagen ${stamp}`;
  }
  return base.slice(0, 60);
}
