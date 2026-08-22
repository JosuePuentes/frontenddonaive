/**
 * Login por credenciales en modo sin API (Vercel FE-only).
 * Misma clave demo que el seed: AdDemo#2026.
 * No expone el password en la UI.
 */
import type { AdOperator } from "@/types/ad-licoreria";
import { adLicoreriaRepository } from "@/services/ad-licoreria/repository";

const DEMO_PASSWORD = "AdDemo#2026";

export function adMockLogin(input: {
  username: string;
  password: string;
}): { ok: true; operator: AdOperator } | { ok: false; error: string } {
  const username = input.username.trim().toLowerCase();
  const password = input.password;
  if (!username || !password) {
    return { ok: false, error: "Usuario y contraseña requeridos" };
  }
  const operators = adLicoreriaRepository.getState().operators;
  const op = operators.find(
    (o: AdOperator) => o.active && o.username.toLowerCase() === username,
  );
  if (!op) {
    return { ok: false, error: "Credenciales inválidas" };
  }
  const personal = op.mockCredential?.trim();
  const passwordOk =
    password === DEMO_PASSWORD || (personal ? password === personal : false);
  if (!passwordOk) {
    return { ok: false, error: "Credenciales inválidas" };
  }
  const r = adLicoreriaRepository.setCurrentOperator(op.id);
  if (!r.ok || !r.data) {
    return { ok: false, error: r.ok ? "No se pudo iniciar sesión" : r.error };
  }
  return { ok: true, operator: r.data };
}

export function adMockLogout() {
  adLicoreriaRepository.setCurrentOperator(null);
}
