import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// Helper ESM local (sin tipos dedicados)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurMediosVitePlugin } from "./scripts/polisur-medios-handler.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurPreinscripcionesVitePlugin } from "./scripts/polisur-preinscripciones-handler.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.POLISUR_MEDIOS_CLAVE) {
    process.env.POLISUR_MEDIOS_CLAVE = env.POLISUR_MEDIOS_CLAVE;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      createPolisurMediosVitePlugin(path.resolve(__dirname)),
      createPolisurPreinscripcionesVitePlugin(path.resolve(__dirname)),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@donaive/core": path.resolve(__dirname, "./packages/core/src/index.ts"),
        "@donaive/domain": path.resolve(
          __dirname,
          "./packages/domain/src/index.ts",
        ),
      },
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          format: "es",
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      esbuildOptions: {
        target: "es2020",
      },
    },
    server: {
      host: true,
      port: 5173,
      // Preview / túneles temporales (trycloudflare, port-forward)
      allowedHosts: true,
    },
  };
});
