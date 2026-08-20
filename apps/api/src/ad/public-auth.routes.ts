/**
 * Auth A&D pública (login + bootstrap) — JWT Fase 4.
 * No exige X-User-Id de Core.
 */
import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getPrisma } from "../config/database.js";
import { ForbiddenError, ValidationError } from "../errors/app-error.js";
import { hashPassword, verifyPassword } from "./password.js";
import { resolveRolePermissions } from "./authorization.js";
import {
  isAdPermission,
  type AdOperatorRoleName,
} from "./permissions.js";
import { writeAdAudit } from "./service.js";
import { signAdAccessToken } from "./jwt.js";

export const adPublicAuthRouter = Router();

const loginSchema = z.object({
  tenantId: z.string().uuid().optional(),
  tenantSlug: z.string().min(1).max(80).optional(),
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(200),
});

const bootstrapSchema = z.object({
  name: z.string().min(1).max(120).default("A&D Licorería & Bodegón"),
  slug: z.string().min(2).max(64).default("ad-licoreria"),
  projectId: z.string().uuid().optional(),
  adminUsername: z.string().min(1).max(64).default("admin"),
  adminPassword: z.string().min(6).max(200),
  adminName: z.string().min(1).max(120).default("Admin A&D"),
});

adPublicAuthRouter.post("/auth/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Payload inválido", parsed.error.flatten());
    }
    const { username, password, tenantId, tenantSlug } = parsed.data;
    if (!tenantId && !tenantSlug) {
      throw new ValidationError("tenantId o tenantSlug requerido");
    }

    const prisma = getPrisma();
    const tenant = tenantId
      ? await prisma.adTenant.findUnique({ where: { id: tenantId } })
      : await prisma.adTenant.findUnique({ where: { slug: tenantSlug! } });

    if (!tenant?.active) {
      throw new ForbiddenError("Tenant A&D no encontrado o inactivo");
    }

    const op = await prisma.adOperator.findUnique({
      where: {
        tenantId_username: {
          tenantId: tenant.id,
          username: username.trim().toLowerCase(),
        },
      },
      include: { permissions: true, warehouse: true },
    });
    if (!op || !op.active || !op.passwordHash) {
      throw new ForbiddenError("Credenciales A&D inválidas");
    }
    if (!verifyPassword(password, op.passwordHash)) {
      throw new ForbiddenError("Credenciales A&D inválidas");
    }

    const explicit = op.permissions
      .map((p) => p.permission)
      .filter(isAdPermission);
    const permissions = [
      ...resolveRolePermissions(op.role as AdOperatorRoleName, explicit),
    ];

    const { token, claims, expiresAt } = signAdAccessToken({
      operatorId: op.id,
      tenantId: tenant.id,
      role: op.role,
      warehouseId: op.warehouseId,
      username: op.username,
    });

    await prisma.adAuthSession.create({
      data: {
        tenantId: tenant.id,
        operatorId: op.id,
        jti: claims.jti,
        expiresAt,
        userAgent: req.header("user-agent")?.slice(0, 240) ?? null,
        ip: req.ip?.slice(0, 64) ?? null,
      },
    });

    await writeAdAudit({
      tenantId: tenant.id,
      operatorId: op.id,
      warehouseId: op.warehouseId,
      action: "login",
      entity: "operator",
      entityId: op.id,
      after: { jti: claims.jti, role: op.role },
    });

    const warehouses = await prisma.adWarehouse.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { code: "asc" },
    });

    res.json({
      data: {
        accessToken: token,
        tokenType: "Bearer",
        expiresAt: expiresAt.toISOString(),
        tenant: {
          id: tenant.id,
          projectId: tenant.projectId,
          name: tenant.name,
          slug: tenant.slug,
          timezone: tenant.timezone,
        },
        operator: {
          id: op.id,
          userId: op.userId,
          username: op.username,
          name: op.name,
          role: op.role,
          warehouseId: op.warehouseId,
          active: op.active,
        },
        permissions,
        warehouses: warehouses.map((w) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          active: w.active,
        })),
        /** Compat F3: headers opcionales (JWT es la autoridad). */
        sessionHeaders: {
          Authorization: `Bearer ${token}`,
          "X-Ad-Operator-Id": op.id,
          "X-Ad-Tenant-Id": tenant.id,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

adPublicAuthRouter.post("/bootstrap", async (req, res, next) => {
  try {
    const parsed = bootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Payload inválido", parsed.error.flatten());
    }
    const input = parsed.data;
    const prisma = getPrisma();
    const existing = await prisma.adTenant.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      res.status(200).json({
        data: {
          created: false,
          tenantId: existing.id,
          slug: existing.slug,
          message: "Tenant ya existe",
        },
      });
      return;
    }

    const projectId = input.projectId ?? randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.adTenant.create({
        data: {
          projectId,
          name: input.name,
          slug: input.slug,
          timezone: "America/Caracas",
        },
      });
      const whLic = await tx.adWarehouse.create({
        data: {
          tenantId: tenant.id,
          name: "Licorería",
          code: "LIC",
        },
      });
      const whBod = await tx.adWarehouse.create({
        data: {
          tenantId: tenant.id,
          name: "Bodegón",
          code: "BOD",
        },
      });
      const admin = await tx.adOperator.create({
        data: {
          tenantId: tenant.id,
          username: input.adminUsername,
          name: input.adminName,
          role: "admin",
          passwordHash: hashPassword(input.adminPassword),
          userId: randomUUID(),
        },
      });
      return { tenant, whLic, whBod, admin };
    });

    res.status(201).json({
      data: {
        created: true,
        tenantId: result.tenant.id,
        slug: result.tenant.slug,
        projectId: result.tenant.projectId,
        warehouses: [
          { id: result.whLic.id, code: result.whLic.code },
          { id: result.whBod.id, code: result.whBod.code },
        ],
        adminUsername: result.admin.username,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Logout / revocación del jti actual. */
adPublicAuthRouter.post("/auth/logout", async (req, res, next) => {
  try {
    const auth = req.header("authorization");
    const m = /^Bearer\s+(.+)$/i.exec(auth ?? "");
    if (!m) {
      res.status(204).end();
      return;
    }
    const { verifyAdAccessToken } = await import("./jwt.js");
    try {
      const claims = verifyAdAccessToken(m[1]);
      const prisma = getPrisma();
      await prisma.adAuthSession.updateMany({
        where: { jti: claims.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await writeAdAudit({
        tenantId: claims.tid,
        operatorId: claims.sub,
        action: "logout",
        entity: "operator",
        entityId: claims.sub,
        after: { jti: claims.jti },
      });
    } catch {
      /* token inválido → igual 204 */
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
