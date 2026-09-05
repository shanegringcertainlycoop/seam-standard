import type { APIRoute } from 'astro'
import { getSanity } from '@/lib/sanity'

export const prerender = false

const SITE_URL = 'https://standard.seamcertification.org'

type RawSeal = {
  name: string
  slug: string
  order?: number
  summary?: string
  accentColor?: string
  activities: Array<{
    activityId: string
    title: string
    marketingTitle?: string
    slug: string
    activityType: 'Driver' | 'Impact'
    pillarSlug: string
    pillarTitle: string
    conceptCode: string
    conceptTitle: string
    conceptSlug: string
    objectiveCode: string
    objectiveTitle: string
    objectiveSlug: string
  }>
}

export const GET: APIRoute = async () => {
  const sanity = getSanity()
  const body = {
    generatedAt: new Date().toISOString(),
    source: SITE_URL,
    seals: [] as Array<{
      name: string
      slug: string
      summary?: string
      url: string
      activityCount: number
      activities: Array<{
        activityId: string
        title: string
        marketingTitle?: string
        displayTitle: string
        url: string
        activityType: 'Driver' | 'Impact'
        pillar: { slug: string; title: string }
        concept: { slug: string; code: string; title: string }
        objective: { slug: string; code: string; title: string }
      }>
    }>,
  }

  if (!sanity) {
    return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders() })
  }

  const seals = await sanity.fetch<RawSeal[]>(`*[_type == "seal"] | order(order asc, name asc) {
    name,
    "slug": slug.current,
    order,
    summary,
    accentColor,
    "activities": activities[]->{
      activityId,
      title,
      marketingTitle,
      "slug": slug.current,
      activityType,
      "pillarSlug": pillar->slug.current,
      "pillarTitle": pillar->title,
      "conceptCode": concept->code,
      "conceptTitle": concept->title,
      "conceptSlug": concept->slug.current,
      "objectiveCode": objective->objectiveCode,
      "objectiveTitle": objective->title,
      "objectiveSlug": objective->slug.current
    }
  }`)

  body.seals = seals.map((s) => ({
    name: s.name?.replace(/\bSEAL\b/g, 'Seal').replace(/\bSEALs\b/g, 'Seals'),
    slug: s.slug,
    summary: s.summary,
    url: `${SITE_URL}/seals/${s.slug}`,
    activityCount: s.activities?.length ?? 0,
    activities: (s.activities ?? []).map((a) => ({
      activityId: a.activityId,
      title: a.title,
      marketingTitle: a.marketingTitle,
      displayTitle: a.marketingTitle?.trim() || a.title,
      url: `${SITE_URL}/${a.pillarSlug}/${a.conceptSlug}/${a.objectiveSlug}/${a.slug}`,
      activityType: a.activityType,
      pillar: { slug: a.pillarSlug, title: a.pillarTitle },
      concept: { slug: a.conceptSlug, code: a.conceptCode, title: a.conceptTitle },
      objective: { slug: a.objectiveSlug, code: a.objectiveCode, title: a.objectiveTitle },
    })),
  }))

  return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders() })
}

function jsonHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
    'cache-control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
    'access-control-allow-origin': '*',
  }
}
