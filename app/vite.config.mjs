import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for deployment mode
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
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
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'; // All node_modules code goes to the vendor chunk
          } else {
            return 'app'; // Everything else goes to the app chunk
          }
        }
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
    },
    hmr: true,
    port: 4005,
    host: "0.0.0.0"
  }
});
