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
        'ts-pattern': path.resolve('./node_modules/ts-pattern'),
        'react-router-dom': path.resolve('./node_modules/react-router-dom'),
        '@radix-ui/react-dropdown-menu': path.resolve('./node_modules/@radix-ui/react-dropdown-menu'),
        '@tabler/icons-react': path.resolve('./node_modules/@tabler/icons-react'),
        'react-spinners': path.resolve('./node_modules/react-spinners'),
      }
    }
  }
});
