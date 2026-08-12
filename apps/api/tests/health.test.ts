import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /health/live", () => {
  it("responde 200 sin requerir base de datos", async () => {
    const app = createApp();
    const res = await request(app).get("/health/live");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.check).toBe("live");
    expect(res.body.service).toBe("donaive-core-api");
  });
});

describe("GET /health", () => {
  it("responde ok sin requerir base de datos conectada", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("donaive-core-api");
    expect(res.body.database).toMatchObject({
      schema: "donaive_core",
    });
  });
});

describe("GET /health/ready", () => {
  it("responde 503 sin DATABASE_URL", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const app = createApp();
      const res = await request(app).get("/health/ready");
      expect(res.status).toBe(503);
    } finally {
      if (original !== undefined) {
        process.env.DATABASE_URL = original;
      }
    }
  });
});
