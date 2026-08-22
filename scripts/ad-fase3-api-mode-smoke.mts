/**
 * Smoke selector mock|api (lógica pura, sin Vite).
 */
function resolveAdDataSource(raw?: string): "mock" | "api" {
  if (raw?.toLowerCase() === "api") return "api";
  return "mock";
}

if (resolveAdDataSource(undefined) !== "mock") throw new Error("default mock");
if (resolveAdDataSource("") !== "mock") throw new Error("empty mock");
if (resolveAdDataSource("MOCK") !== "mock") throw new Error("MOCK→mock");
if (resolveAdDataSource("api") !== "api") throw new Error("api");
if (resolveAdDataSource("API") !== "api") throw new Error("API→api");

console.log("PASS VITE_AD_DATA_SOURCE selector mock|api");
