// @ts-check
import { defineConfig } from 'astro/config';
import aiRobotsTxt from 'astro-ai-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: "https://shaneis.me",
  markdown: {
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        wrap: true,
      },
    },
  integrations: [aiRobotsTxt()],
});