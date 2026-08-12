import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /health", () => {
  it("responde ok sin requerir base de datos", async () => {
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
