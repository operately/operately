// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  server: { host: true},

  integrations: [
    tailwind(),
    react({
      // Enable TypeScript JSX components
      include: ['**/*.{jsx,tsx}'],
      // For React 19
      experimentalReactChildren: true
    })
  ],

  vite: {
    resolve: {
      alias: {
        'ts-pattern': path.resolve('./node_modules/ts-pattern')
      }
    }
  }
});
