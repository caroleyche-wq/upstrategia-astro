// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://www.upstrategia.fr",
  trailingSlash: "never",

  integrations: [
  sitemap({
    filter: (page) => {
      // Exclure des routes si un jour tu en as besoin
      const blocked = ["/api", "/recherche"];
      return !blocked.some((b) => page.startsWith(b));
    },
  }),
],

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});
