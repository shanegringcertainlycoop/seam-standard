import type { APIRoute } from 'astro'
import { getSanity } from '@/lib/sanity'

export const prerender = false

const SITE_URL = 'https://standard.seamcertification.org'

type RawActivity = {
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
  sdgs?: number[]
}

export const GET: APIRoute = async () => {
  const sanity = getSanity()
  const body = {
    generatedAt: new Date().toISOString(),
    source: SITE_URL,
    pillars: [] as Array<{
      slug: string
      title: string
      activityCount: number
      activities: Array<{
        activityId: string
        title: string
        marketingTitle?: string
        displayTitle: string
        url: string
        activityType: 'Driver' | 'Impact'
        sdgs: number[]
        concept: { slug: string; code: string; title: string }
        objective: { slug: string; code: string; title: string }
      }>
    }>,
  }

  if (!sanity) {
    return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders() })
  }

  const activities = await sanity.fetch<RawActivity[]>(
    `*[_type == "activity"] | order(activityId asc) {
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
      "objectiveSlug": objective->slug.current,
      sdgs
    }`,
  )

  const byPillar = new Map<string, (typeof body.pillars)[number]>()
  for (const a of activities) {
    if (!a.pillarSlug) continue
    let bucket = byPillar.get(a.pillarSlug)
    if (!bucket) {
      bucket = {
        slug: a.pillarSlug,
        title: a.pillarTitle,
        activityCount: 0,
        activities: [],
      }
      byPillar.set(a.pillarSlug, bucket)
    }
    bucket.activities.push({
      activityId: a.activityId,
      title: a.title,
      marketingTitle: a.marketingTitle,
      displayTitle: a.marketingTitle?.trim() || a.title,
      url: `${SITE_URL}/${a.pillarSlug}/${a.conceptSlug}/${a.objectiveSlug}/${a.slug}`,
      activityType: a.activityType,
      sdgs: a.sdgs ?? [],
      concept: { slug: a.conceptSlug, code: a.conceptCode, title: a.conceptTitle },
      objective: { slug: a.objectiveSlug, code: a.objectiveCode, title: a.objectiveTitle },
    })
    bucket.activityCount++
  }
  body.pillars = Array.from(byPillar.values())

  return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders() })
}

function jsonHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
    'cache-control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
    'access-control-allow-origin': '*',
  }
}
