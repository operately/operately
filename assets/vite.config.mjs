import { defineConfig, loadEnv } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    publicDir: false,
    build: {
      outDir: "../priv/static",
      emptyOutDir: false,
      target: ["es6"],
      manifest: false,
      rollupOptions: {
        input: "js/app.tsx",
        output: {
          assetFileNames: "assets/[name][extname]",
          chunkFileNames: "[name].js",
          entryFileNames: "assets/[name].js",
        },
      },
      commonjsOptions: {
        exclude: [],
        include: ["vendor/topbar.js", /node_modules/],
      },
    },
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    define: {
      __APP_ENV__: env.APP_ENV,
    },
    resolve: {
      alias: {
        "@/ee": path.resolve(__dirname, "../ee/assets/js"),
        "@": path.resolve(__dirname, "./js"),
      },
    },
  };
});
