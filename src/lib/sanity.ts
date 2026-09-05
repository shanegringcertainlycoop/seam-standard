import { createClient, type SanityClient } from '@sanity/client'
import { readEnv } from './env'

// Built lazily on first use rather than at module scope: Cloudflare only
// attaches env vars once a request is in flight, so a module-scope read would
// always see an unconfigured project. Cached after the first call.
let cached: SanityClient | null | undefined

export function getSanity(): SanityClient | null {
  if (cached !== undefined) return cached

  const projectId = readEnv('SANITY_PROJECT_ID')
  const dataset = readEnv('SANITY_DATASET') ?? 'production'

  cached = projectId
    ? createClient({
        projectId,
        dataset,
        apiVersion: '2025-01-01',
        useCdn: false,
      })
    : null

  return cached
}
