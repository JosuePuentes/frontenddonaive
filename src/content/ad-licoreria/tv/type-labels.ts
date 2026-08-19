import type { AdTvContentType } from "@/types/ad-tv";

export const AD_TV_TYPE_OPTIONS: Array<{
  value: AdTvContentType;
  label: string;
}> = [
  { value: "IMAGE", label: "Imagen" },
  { value: "VIDEO", label: "Video (archivo MP4)" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TEXT", label: "Texto" },
  { value: "MENU", label: "Menú" },
  { value: "PROMOTION", label: "Promoción" },
];

export function adTvTypeLabel(type: string): string {
  return AD_TV_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
