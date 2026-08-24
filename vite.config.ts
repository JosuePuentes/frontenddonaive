import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
// Helper ESM local (sin tipos dedicados)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurMediosVitePlugin } from "./scripts/polisur-medios-handler.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurPreinscripcionesVitePlugin } from "./scripts/polisur-preinscripciones-handler.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurSiteVitePlugin } from "./scripts/polisur-site-handler.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error módulo .mjs de herramientas locales
import { createPolisurClicksVitePlugin } from "./scripts/polisur-clicks-handler.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.POLISUR_MEDIOS_CLAVE) {
    process.env.POLISUR_MEDIOS_CLAVE = env.POLISUR_MEDIOS_CLAVE;
  }

  const softwareHost = env.VITE_DONAIVE_SOFTWARE_HOST === "true";
  const pwaStart = softwareHost ? "/" : "/software";

  return {
    plugins: [
      react(),
      tailwindcss(),
      createPolisurMediosVitePlugin(path.resolve(__dirname)),
      createPolisurPreinscripcionesVitePlugin(path.resolve(__dirname)),
      createPolisurSiteVitePlugin(path.resolve(__dirname)),
      createPolisurClicksVitePlugin(path.resolve(__dirname)),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["logo.png", "fonts.css", "vite.svg"],
        manifest: {
          name: "Donaive Software",
          short_name: "Donaive",
          description:
            "Sistema administrativo offline-first para tu negocio (POS, inventario, compras y finanzas).",
          theme_color: "#0c1117",
          background_color: "#0c1117",
          display: "standalone",
          orientation: "any",
          lang: "es",
          start_url: pwaStart,
          scope: softwareHost ? "/" : "/software",
          categories: ["business", "finance", "productivity"],
          icons: [
            {
              src: "/logo.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/logo.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/logo.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,json}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/polisur\/api/],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-stylesheets",
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
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
      /** Un solo túnel FE: /api → API local (assets TV no dependen de otro dominio). */
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
