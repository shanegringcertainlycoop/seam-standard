import type { APIRoute } from 'astro'

export const prerender = false

const SITE = 'https://standard.seamcertification.org'

// We want LLM crawlers as well as classic SEO crawlers to ingest the standard,
// so the file is intentionally permissive. Block only internal endpoints.
const body = `# SEAM Standard reference site
User-agent: *
Allow: /
Disallow: /api/

# Common LLM crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Anthropic-AI
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: ${SITE}/sitemap.xml
`

export const GET: APIRoute = () =>
  new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
