import { createClient, type SanityClient } from '@sanity/client'

// Read at runtime so the Netlify function picks up env vars at request time,
// not build time. (import.meta.env is resolved by Vite at build, which means
// missing env vars during the build get inlined as undefined.)
const projectId =
  process.env.SANITY_PROJECT_ID ?? import.meta.env.SANITY_PROJECT_ID
const dataset =
  process.env.SANITY_DATASET ?? import.meta.env.SANITY_DATASET ?? 'production'

export const sanityConfigured = Boolean(projectId)

export const sanity: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: false,
    })
  : null
