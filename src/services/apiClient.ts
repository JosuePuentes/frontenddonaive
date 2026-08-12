import { API_BASE_URL } from "@/config/api";

export type ApiOkResult<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiErrorResult = {
  ok: false;
  status?: number;
  error: {
    message: string;
    // Useful for debugging; do not assume shape.
    details?: unknown;
  };
};

export type ApiResult<T> = ApiOkResult<T> | ApiErrorResult;

export type ApiRequestOptions = {
  /** Headers adicionales (p.ej. prueba temporal de auth). */
  headers?: Record<string, string>;
};

function joinUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}`;
}

/**
 * Cliente HTTP reutilizable para el frontend.
 * - Usa fetch nativo.
 * - Descansa en `API_BASE_URL` configurado vía `VITE_API_BASE_URL`.
 */
export async function apiGetJson<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<ApiResult<T>> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      error: {
        message:
          "VITE_API_BASE_URL no está configurada. Configura el frontend en Vercel.",
      },
    };
  }

  const url = joinUrl(API_BASE_URL, path);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });

    const status = res.status;

    if (!res.ok) {
      let details: unknown = undefined;
      try {
        details = await res.json();
      } catch {
        // Response no JSON. Dejamos detalles indefinidos.
      }

      return {
        ok: false,
        status,
        error: {
          message: `HTTP ${status} al llamar ${path}`,
          details,
        },
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, status, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error de conexión a la API";

    return {
      ok: false,
      error: {
        message,
        details: err,
      },
    };
  }
}
