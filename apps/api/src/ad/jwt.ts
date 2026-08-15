/**
 * JWT A&D (HS256) — auth definitiva Fase 4.
 * Sin dependencia externa: HMAC-SHA256 + base64url.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

export type AdJwtClaims = {
  /** JWT ID (revocación). */
  jti: string;
  /** Operator id. */
  sub: string;
  /** Tenant id. */
  tid: string;
  role: string;
  /** Warehouse asignado (null → omitido / string "null"). */
  wid: string | null;
  username: string;
  iat: number;
  exp: number;
  iss: "ad-licoreria";
};

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function getAdJwtSecret(): string {
  const secret =
    process.env.AD_JWT_SECRET ??
    env.AD_JWT_SECRET ??
    process.env.JWT_SECRET ??
    env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new UnauthorizedError(
      "AD_JWT_SECRET/JWT_SECRET no configurado (≥16 chars)",
    );
  }
  return secret;
}

export function getAdJwtTtlSeconds(): number {
  return Number(
    process.env.AD_JWT_TTL_SECONDS ?? env.AD_JWT_TTL_SECONDS ?? 43_200,
  );
}

export function signAdAccessToken(input: {
  operatorId: string;
  tenantId: string;
  role: string;
  warehouseId: string | null;
  username: string;
  ttlSeconds?: number;
}): { token: string; claims: AdJwtClaims; expiresAt: Date } {
  const now = Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? getAdJwtTtlSeconds();
  const claims: AdJwtClaims = {
    jti: randomUUID(),
    sub: input.operatorId,
    tid: input.tenantId,
    role: input.role,
    wid: input.warehouseId,
    username: input.username,
    iat: now,
    exp: now + ttl,
    iss: "ad-licoreria",
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(claims));
  const data = `${header}.${payload}`;
  const sig = b64url(
    createHmac("sha256", getAdJwtSecret()).update(data).digest(),
  );
  return {
    token: `${data}.${sig}`,
    claims,
    expiresAt: new Date(claims.exp * 1000),
  };
}

export function verifyAdAccessToken(token: string): AdJwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedError("Token A&D inválido");
  }
  const [header, payload, sig] = parts;
  const data = `${header}.${payload}`;
  const expected = b64url(
    createHmac("sha256", getAdJwtSecret()).update(data).digest(),
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new UnauthorizedError("Firma JWT A&D inválida");
  }
  let claims: AdJwtClaims;
  try {
    claims = JSON.parse(fromB64url(payload).toString("utf8")) as AdJwtClaims;
  } catch {
    throw new UnauthorizedError("Payload JWT A&D inválido");
  }
  if (claims.iss !== "ad-licoreria" || !claims.sub || !claims.tid || !claims.jti) {
    throw new UnauthorizedError("Claims JWT A&D incompletos");
  }
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    throw new UnauthorizedError("Token A&D expirado");
  }
  return claims;
}

export function extractBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return m?.[1]?.trim() || null;
}

export function allowAdDevHeaders(): boolean {
  if ((process.env.NODE_ENV ?? env.NODE_ENV) === "production") return false;
  const raw = process.env.AD_ALLOW_DEV_HEADERS ?? env.AD_ALLOW_DEV_HEADERS ?? "0";
  return raw === "1" || raw === "true";
}
