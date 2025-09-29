import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, splitVendorChunkPlugin } from "vite";
import { moduleAnalyzerPlugin, resumeStdinPlugin } from "./assets/custom-vite-plugins.mjs";

const isProd = process.env.NODE_ENV === "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to copy static assets from assets/static to build output
const copyStaticAssetsPlugin = () => ({
  name: "copy-static-assets",
  generateBundle() {
    const staticDir = path.resolve(__dirname, "assets/static");
    const outDir = path.resolve(__dirname, "priv/static");

    if (existsSync(staticDir)) {
      const files = readdirSync(staticDir);

      files.forEach((file) => {
        const src = path.join(staticDir, file);
        const dest = path.join(outDir, file);
        copyFileSync(src, dest);
        console.log(`Copied ${file} to build output`);
      });
    }
  },
});

export default defineConfig({
  plugins: [resumeStdinPlugin, moduleAnalyzerPlugin, react(), splitVendorChunkPlugin(), copyStaticAssetsPlugin()],

  root: __dirname,

  build: {
    outDir: "priv/static",
    emptyOutDir: true,
    minify: isProd,
    sourcemap: !isProd || "inline",
    target: "es2020",
    manifest: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "assets/js/app.tsx"),
      },
    },
  },

  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],

    alias: [
      { find: /^@\/ee\/(.*)$/, replacement: path.resolve(__dirname, "ee/assets/js/$1") },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "assets/js/$1") },
      { find: "turboui", replacement: path.resolve(__dirname, "../turboui/src") },
    ],
  },

  // Vite has built-in watch mode via the dev server
  server: {
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**", "**/.git/**", "!../turboui/src/**"],
    },
    hmr: true,
    port: 4005,
    host: "0.0.0.0",
  },
});
