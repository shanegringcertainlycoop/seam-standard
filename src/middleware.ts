import { defineMiddleware } from 'astro:middleware'
import { isPreview } from '@/lib/env'

// Netlify applied these from netlify.toml [[headers]]. Cloudflare's _headers
// file only covers static assets, so on-demand responses get them here.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000',
}

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const response = await next()

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value)
  }
  // Netlify served on-demand HTML as no-cache. Routes that set their own
  // policy (robots.txt, sitemap.xml) keep it.
  if (!response.headers.has('cache-control')) {
    response.headers.set('Cache-Control', 'no-cache')
  }
  if (isPreview()) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})
