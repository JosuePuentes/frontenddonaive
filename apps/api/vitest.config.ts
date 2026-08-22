import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    /** Evita carreras al mutar process.env.DATABASE_URL entre suites. */
    fileParallelism: false,
  },
});
