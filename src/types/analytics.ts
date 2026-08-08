export type AnalyticsMetric = {
  id: string;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "flat";
};
