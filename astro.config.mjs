// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://simpleinvesting.org',

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'pl',
        locales: {
          pl: 'pl-PL',
          en: 'en-US',
        },
      },
      filter: (page) => !page.includes('/api/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: netlify(),
  output: 'server',
});
