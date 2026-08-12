import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { isDatabaseConfigured } from "./config/env.js";

const app = createApp();

async function start() {
  if (isDatabaseConfigured()) {
    const connected = await connectDatabase();
    if (connected) {
      console.log("[api] PostgreSQL conectado (schema: donaive_core)");
    }
  } else {
    console.warn(
      "[api] DATABASE_URL no configurada — endpoints /api/v1/* responderán 503",
    );
  }

  app.listen(env.PORT, () => {
    console.log(`[api] Donaive Core API escuchando en puerto ${env.PORT}`);
  });
}

process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

start().catch((err) => {
  console.error("[api] fallo al iniciar", err);
  process.exit(1);
});
