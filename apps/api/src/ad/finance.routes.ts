import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { adFinanceService } from "./finance.service.js";
import {
  createExchangeSchema,
  createExpenseSchema,
  createFinancialAccountSchema,
  createReconciliationSchema,
  createTransferSchema,
  listMovementsQuerySchema,
  parseBody,
  reconciliationPreviewSchema,
  updateFinanceSettingsSchema,
  updateFinancialAccountSchema,
} from "./finance.validation.js";

export const adFinanceRouter = Router();

adFinanceRouter.get("/finance/settings", async (req, res, next) => {
  try {
    const data = await adFinanceService.getSettings(getAdContext(req));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.put("/finance/settings", async (req, res, next) => {
  try {
    const body = parseBody(updateFinanceSettingsSchema, req.body);
    const data = await adFinanceService.updateSettings(getAdContext(req), body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.get("/finance/accounts", async (req, res, next) => {
  try {
    const data = await adFinanceService.listAccounts(getAdContext(req));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/accounts", async (req, res, next) => {
  try {
    const body = parseBody(createFinancialAccountSchema, req.body);
    const data = await adFinanceService.createAccount(getAdContext(req), body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.patch("/finance/accounts/:id", async (req, res, next) => {
  try {
    const body = parseBody(updateFinancialAccountSchema, req.body);
    const data = await adFinanceService.updateAccount(
      getAdContext(req),
      req.params.id,
      body,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.get("/finance/movements", async (req, res, next) => {
  try {
    const q = listMovementsQuerySchema.parse(req.query);
    const data = await adFinanceService.listMovements(getAdContext(req), q);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.get("/finance/movements/:id", async (req, res, next) => {
  try {
    const data = await adFinanceService.getMovement(
      getAdContext(req),
      req.params.id,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/transfers", async (req, res, next) => {
  try {
    const body = parseBody(createTransferSchema, req.body);
    const data = await adFinanceService.createTransferDraft(
      getAdContext(req),
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/exchange/preview", async (req, res, next) => {
  try {
    const body = parseBody(createExchangeSchema, req.body);
    const data = await adFinanceService.exchangePreview(getAdContext(req), {
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      amount: body.amount,
      rateBsPerUsd: body.rateBsPerUsd,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/exchange", async (req, res, next) => {
  try {
    const body = parseBody(createExchangeSchema, req.body);
    const data = await adFinanceService.createTransferDraft(getAdContext(req), {
      ...body,
      asExchange: true,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/expenses", async (req, res, next) => {
  try {
    const body = parseBody(createExpenseSchema, req.body);
    const data = await adFinanceService.createExpenseDraft(
      getAdContext(req),
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/movements/:id/totalize", async (req, res, next) => {
  try {
    const data = await adFinanceService.totalizeMovement(
      getAdContext(req),
      req.params.id,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/movements/:id/confirm", async (req, res, next) => {
  try {
    const data = await adFinanceService.confirmMovement(
      getAdContext(req),
      req.params.id,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.get(
  "/finance/products/:productId/replacement-cost",
  async (req, res, next) => {
    try {
      const data = await adFinanceService.getReplacementCost(
        getAdContext(req),
        req.params.productId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

/** Fase 9 — conciliación */
adFinanceRouter.get("/finance/reconciliations/preview", async (req, res, next) => {
  try {
    const q = reconciliationPreviewSchema.parse(req.query);
    const data = await adFinanceService.reconciliationPreview(
      getAdContext(req),
      q,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.get("/finance/reconciliations", async (req, res, next) => {
  try {
    const data = await adFinanceService.listReconciliations(getAdContext(req), {
      accountId: req.query.accountId ? String(req.query.accountId) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adFinanceRouter.post("/finance/reconciliations", async (req, res, next) => {
  try {
    const body = parseBody(createReconciliationSchema, req.body);
    const data = await adFinanceService.createReconciliation(
      getAdContext(req),
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});
