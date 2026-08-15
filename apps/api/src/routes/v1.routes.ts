import { Router } from "express";
import { getAuth } from "../middleware/auth.middleware.js";
import { projectService } from "../services/project.service.js";
import {
  licenseService,
  planService,
  subscriptionService,
  templateService,
  updateService,
} from "../services/platform.service.js";
import { auditService } from "../services/audit.service.js";
import { API_CAPABILITIES } from "../auth/capabilities.js";
import { requireCapability } from "../auth/authorization.js";
import { adRouter } from "../ad/routes.js";

export const v1Router = Router();

/** A&D Licorería — núcleo Fase 1 (schema ad_licoreria). */
v1Router.use("/ad", adRouter);

v1Router.get("/projects", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const projects = await projectService.list(auth);
    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/projects/:id", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const project = await projectService.getById(auth, req.params.id);
    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

v1Router.post("/projects", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const project = await projectService.create(auth, req.body);
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/templates", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const templates = await templateService.list(auth);
    res.json({ data: templates });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/updates", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const updates = await updateService.list(auth);
    res.json({ data: updates });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/plans", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const plans = await planService.list(auth);
    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/licenses", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const licenses = await licenseService.list(auth);
    res.json({ data: licenses });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/subscriptions", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const subscriptions = await subscriptionService.list(auth);
    res.json({ data: subscriptions });
  } catch (err) {
    next(err);
  }
});

v1Router.get("/audit", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    requireCapability(auth, API_CAPABILITIES.AUDIT_READ);
    const logs = await auditService.list(auth, {
      projectId: req.query.projectId as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
});
