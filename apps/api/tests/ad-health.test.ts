import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /health/ad", () => {
  it("responde metadata del módulo A&D sin requerir DB", async () => {
    const app = createApp();
    const res = await request(app).get("/health/ad");
    expect(res.status).toBe(200);
    expect(res.body.module).toBe("ad-licoreria");
    expect(res.body.schema).toBe("ad_licoreria");
    expect(res.body.phase).toBe(1);
    expect(res.body.apiPrefix).toBe("/api/v1/ad");
  });
});
