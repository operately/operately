import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import path from 'path';

// Check for deployment mode
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  
  build: {
    outDir: 'priv/static/assets',
    emptyOutDir: true,
    minify: isProd,
    sourcemap: !isProd || 'inline',
    target: 'es2020',
    manifest: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'assets/js/app.tsx')
      },
      external: [/\.css$/, /fonts\/.*/, /images\/.*/]
    }
  },
  
  resolve: {
    dedupe: ['react', 'react-dom'],

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
    },
    hmr: true,
    port: 4005,
    host: "0.0.0.0"
  }
});
