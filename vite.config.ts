import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@donaive/core": path.resolve(__dirname, "./packages/core/src/index.ts"),
      "@donaive/domain": path.resolve(__dirname, "./packages/domain/src/index.ts"),
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
});
