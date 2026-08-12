/** Identificador opaco de entidad (UUID en runtime futuro). */
export type EntityId = string;

/** Marca de tiempo ISO 8601. */
export type ISODateTime = string;

/** Marca de fecha ISO 8601 (YYYY-MM-DD). */
export type ISODate = string;

/** Valor JSON serializable para auditoría y personalizaciones. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/** Estados de ciclo de vida comerciales / de acceso. */
export const COMMERCIAL_LIFECYCLE_STATUSES = [
  "active",
  "trial",
  "past_due",
  "expired",
  "suspended",
  "cancelled",
] as const;

export type CommercialLifecycleStatus =
  (typeof COMMERCIAL_LIFECYCLE_STATUSES)[number];

/** Ventana temporal con periodo de gracia opcional. */
export type LifecycleWindow = {
  startDate: ISODate;
  endDate?: ISODate;
  status: CommercialLifecycleStatus;
  gracePeriodEndsAt?: ISODateTime;
};
