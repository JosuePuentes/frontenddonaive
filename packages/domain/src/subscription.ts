import type { EntityId, ISODateTime, LifecycleWindow } from "./common";

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trial",
  "past_due",
  "expired",
  "suspended",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Estado comercial de la relación del cliente con Donaive.
 * El vencimiento NO elimina datos del Project.
 */
export type Subscription = {
  readonly id: EntityId;
  readonly organizationId: EntityId;
  readonly projectId?: EntityId;
  readonly planId: EntityId;
  status: SubscriptionStatus;
  lifecycle: LifecycleWindow;
  billingCycleRef?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
