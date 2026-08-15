import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

/**
 * Hash de contraseña con scrypt (Node crypto).
 * Formato: `scrypt$<saltHex>$<hashHex>`
 * Nunca guardar texto plano.
 */
export function hashPassword(plain: string): string {
  if (!plain || plain.length < 6) {
    throw new Error("Password demasiado corto");
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored.startsWith("scrypt$")) {
    return false;
  }
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = scryptSync(plain, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
