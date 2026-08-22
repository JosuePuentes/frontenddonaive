import { Router } from "express";
import { z } from "zod";
import { getAdContext } from "./middleware.js";
import { adPortalService } from "./portal.service.js";
import { parseBody } from "./validation.js";
import { ValidationError } from "../errors/app-error.js";

export const adPortalRouter = Router();

const upsertOperatorSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  role: z.enum([
    "admin",
    "supervisor",
    "cajero",
    "mesonera",
    "inventario",
    "tv",
  ]),
  active: z.boolean().optional(),
  warehouseId: z.string().uuid().nullable().optional(),
  password: z.string().min(6).max(200).optional(),
  permissions: z.array(z.string()).optional(),
});

const patchWarehouseSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  active: z.boolean().optional(),
});

const upsertSpaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120).optional(),
  number: z.string().min(1).max(40).optional(),
  code: z.string().min(1).max(40).optional(),
  spaceType: z
    .enum(["mesa", "barra", "area", "privado", "terraza", "otro"])
    .optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  status: z
    .enum([
      "disponible",
      "ocupada",
      "cuenta_abierta",
      "cuenta_prepagada",
      "reservada",
      "cerrada",
      "inactiva",
    ])
    .optional(),
  active: z.boolean().optional(),
  warehouseId: z.string().uuid().nullable().optional(),
});

const accountPaymentSchema = z.object({
  method: z.string().min(1).max(64),
  currency: z.enum(["USD", "BS"]),
  amount: z.number().positive(),
  reference: z.string().max(120).optional(),
  bank: z.string().max(120).optional(),
});

adPortalRouter.get("/operators", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.listOperators(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.post("/operators", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(upsertOperatorSchema, req.body);
    const data = await adPortalService.upsertOperator(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.put("/operators/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(upsertOperatorSchema, {
      ...req.body,
      id: req.params.id,
    });
    const data = await adPortalService.upsertOperator(ctx, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/permissions/matrix", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.getRoleMatrix(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.patch("/warehouses/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(patchWarehouseSchema, req.body);
    if (body.name === undefined && body.active === undefined) {
      throw new ValidationError("Nada que actualizar");
    }
    const data = await adPortalService.updateWarehouse(
      ctx,
      req.params.id,
      body,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/spaces", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.listSpaces(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.post("/spaces", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(upsertSpaceSchema, req.body);
    const data = await adPortalService.upsertSpace(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.put("/spaces/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(upsertSpaceSchema, {
      ...req.body,
      id: req.params.id,
    });
    const data = await adPortalService.upsertSpace(ctx, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/accounts", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.listAccounts(ctx, {
      mesoneraId:
        typeof req.query.mesoneraId === "string"
          ? req.query.mesoneraId
          : undefined,
      status:
        typeof req.query.status === "string" ? req.query.status : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/accounts/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.getAccount(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.post("/accounts/:id/payments", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(accountPaymentSchema, req.body);
    const data = await adPortalService.addAccountPayment(
      ctx,
      req.params.id,
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/snapshot", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.getSnapshot(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adPortalRouter.get("/reports/summary", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adPortalService.reportsSummary(ctx, {
      warehouseId:
        typeof req.query.warehouseId === "string"
          ? req.query.warehouseId
          : undefined,
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
