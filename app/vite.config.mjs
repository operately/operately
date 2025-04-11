import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import path from 'path';

// Based on: https://github.com/vitejs/vite/issues/19091
const resumeStdinPlugin = {
  name: "resume-stdin",
  configureServer: () => {
    // runs when the dev server is triggered, but not on other commands:
    process.stdin.resume();
    // an 'end' listener is already added in `setupSIGTERMListener` here: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts#L1537
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for deployment mode
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    resumeStdinPlugin,
    react(), 
    splitVendorChunkPlugin()
  ],

  root: __dirname,
  
  build: {
    outDir: 'priv/static',
    emptyOutDir: true,
    minify: isProd,
    sourcemap: !isProd || 'inline',
    target: 'es2020',
    manifest: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'assets/js/app.tsx')
      }
    }
  },
  
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],

    alias: [
      { find: /^@\/ee\/(.*)$/, replacement: path.resolve(__dirname, 'ee/assets/js/$1')},
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, 'assets/js/$1')},
      { find: 'turboui', replacement: path.resolve(__dirname, '../turboui/src')}
    ] 
  },
  
  // Vite has built-in watch mode via the dev server
  server: {
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**', '!../turboui/src/**']
    },
    hmr: true,
    port: 4005,
    host: "0.0.0.0"
  }
});
