import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, splitVendorChunkPlugin } from "vite";
import { moduleAnalyzerPlugin, resumeStdinPlugin } from "./assets/custom-vite-plugins.mjs";

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Only include heavy analysis plugin in production builds where we need the insights
const plugins = [
  resumeStdinPlugin,
  react({
    // Enable Fast Refresh for better development experience
    fastRefresh: !isProd,
  }),
];

// Only add expensive plugins when needed
if (isProd) {
  plugins.push(moduleAnalyzerPlugin);
  plugins.push(splitVendorChunkPlugin());
}

export default defineConfig({
  plugins,

  root: __dirname,

  // Enable build cache for faster rebuilds
  cacheDir: "node_modules/.vite",

  build: {
    outDir: "priv/static",
    emptyOutDir: true,
    minify: isProd,
    sourcemap: !isProd || "inline",
    target: "es2022", // Updated to newer target for better performance
    manifest: true,
    // Optimize chunk size and build performance
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "assets/js/app.tsx"),
      },
      // Optimize chunking for better caching only in production
      output: isProd ? {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
          editor: ['@tiptap/core', '@tiptap/react', '@tiptap/starter-kit'],
        }
      } : undefined,
    },
  },

  // Optimize dependency pre-bundling for faster development builds
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'classnames',
      'date-fns',
      'nprogress',
      'turboui',
    ],
    // Force re-optimization on dependency changes
    force: isDev,
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
