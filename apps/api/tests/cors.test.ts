import { describe, it, expect } from "vitest";
import { buildCorsOptions } from "../src/config/cors.js";

describe("CORS configuration", () => {
  it("permite todos los orígenes en desarrollo sin CORS_ORIGIN", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCors = process.env.CORS_ORIGIN;
    process.env.NODE_ENV = "development";
    delete process.env.CORS_ORIGIN;

    try {
      const options = buildCorsOptions();
      expect(options.origin).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalCors !== undefined) {
        process.env.CORS_ORIGIN = originalCors;
      }
    }
  });

  it("restringe orígenes cuando CORS_ORIGIN está definido", () => {
    const originalCors = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = "https://donaive.com.ve,https://app.donaive.com.ve";

    try {
      const options = buildCorsOptions();
      expect(options.origin).toEqual([
        "https://donaive.com.ve",
        "https://app.donaive.com.ve",
      ]);
    } finally {
      if (originalCors !== undefined) {
        process.env.CORS_ORIGIN = originalCors;
      } else {
        delete process.env.CORS_ORIGIN;
      }
    }
  });

  it("deniega orígenes externos en producción sin CORS_ORIGIN", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCors = process.env.CORS_ORIGIN;
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ORIGIN;

    try {
      const options = buildCorsOptions();
      expect(options.origin).toBe(false);
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalCors !== undefined) {
        process.env.CORS_ORIGIN = originalCors;
      }
    }
  });
});
