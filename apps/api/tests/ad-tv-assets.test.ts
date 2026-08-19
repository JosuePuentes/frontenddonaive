import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("A&D TV asset upload", () => {
  const app = createApp();
  const payload = Buffer.from("fake-mp4-bytes-for-tv-upload");

  it("acepta subida binaria con Content-Type video/mp4", async () => {
    const res = await request(app)
      .post("/api/v1/ad/tv/assets/binary")
      .query({ tenant: "ad-licoreria", mimeType: "video/mp4", filename: "promo.mp4" })
      .set("Content-Type", "video/mp4")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data?.path).toMatch(/\/api\/v1\/ad\/tv\/assets\//);
    expect(res.body.data?.mimeType).toBe("video/mp4");
    expect(res.body.data?.bytes).toBe(payload.length);

    const getRes = await request(app).get(res.body.data.path);
    expect(getRes.status).toBe(200);
    expect(getRes.headers["content-type"]).toMatch(/video\/mp4/);
  });

  it("acepta application/octet-stream e infiere MIME por filename", async () => {
    const res = await request(app)
      .post("/api/v1/ad/tv/assets/binary")
      .query({ tenant: "ad-licoreria", filename: "clip.mp4" })
      .set("Content-Type", "application/octet-stream")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data?.mimeType).toBe("video/mp4");
  });

  it("rechaza body vacío con mensaje claro", async () => {
    const res = await request(app)
      .post("/api/v1/ad/tv/assets/binary")
      .query({ tenant: "ad-licoreria", mimeType: "video/mp4" })
      .set("Content-Type", "application/octet-stream")
      .send(Buffer.alloc(0));

    expect(res.status).toBe(400);
    expect(String(res.body.error?.message || "")).toMatch(/no recibió el archivo/i);
  });

  it("sube por partes (init + chunk + complete)", async () => {
    const init = await request(app)
      .post("/api/v1/ad/tv/assets/binary/init")
      .send({ tenant: "ad-licoreria", mimeType: "video/mp4", filename: "parte.mp4" });

    expect(init.status).toBe(200);
    const id = init.body.data?.id as string;
    expect(id).toBeTruthy();

    const chunk = await request(app)
      .post("/api/v1/ad/tv/assets/binary/chunk")
      .query({ tenant: "ad-licoreria", id })
      .set("Content-Type", "application/octet-stream")
      .send(payload);
    expect(chunk.status).toBe(200);
    expect(chunk.body.data?.received).toBe(payload.length);

    const done = await request(app)
      .post("/api/v1/ad/tv/assets/binary/complete")
      .send({ tenant: "ad-licoreria", id, mimeType: "video/mp4", filename: "parte.mp4" });
    expect(done.status).toBe(200);
    expect(done.body.data?.bytes).toBe(payload.length);
    expect(done.body.data?.path).toMatch(/\/api\/v1\/ad\/tv\/assets\//);
  });
});
