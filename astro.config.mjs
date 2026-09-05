import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://standard.seamcertification.org',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
})
