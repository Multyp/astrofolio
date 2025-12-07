import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { remarkObsidianLinks } from './src/utils/remarkObsidianLinks';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkObsidianLinks],
    shikiConfig: {
      theme: 'dracula',
    },
  },
});
