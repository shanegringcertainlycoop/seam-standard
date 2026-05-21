import type { APIRoute } from 'astro'
import { sanity } from '@/lib/sanity'
import type { RatingSystemApplication } from '@/lib/sanity.queries'

export const prerender = false

const SITE_URL = 'https://standard.seamcertification.org'

type RawMark = {
  activityId: string
  title: string
  slug: string
  activityType: 'Driver' | 'Impact'
  ratingSystemApplication?: RatingSystemApplication
  pillarTitle: string
  pillarSlug: string
  conceptCode: string
  conceptTitle: string
  conceptSlug: string
  objectiveCode: string
  objectiveTitle: string
  objectiveSlug: string
}

function ratingSystems(rs?: RatingSystemApplication): string[] {
  if (!rs) return []
  const out: string[] = []
  if (rs.bi_developer) out.push('B+I:D')
  if (rs.bi_occupier) out.push('B+I:O')
  if (rs.om_developer) out.push('O+M:D')
  if (rs.om_occupier) out.push('O+M:O')
  if (rs.cd) out.push('CD')
  return out
}

export const GET: APIRoute = async () => {
  const body = {
    generatedAt: new Date().toISOString(),
    source: SITE_URL,
    activities: [] as Array<{
      activityId: string
      title: string
      url: string
      activityType: 'Driver' | 'Impact'
      ratingSystems: string[]
      pillar: { slug: string; title: string }
      concept: { slug: string; code: string; title: string }
      objective: { slug: string; code: string; title: string }
    }>,
  }

  if (!sanity) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: jsonHeaders(),
    })
  }

  const marks = await sanity.fetch<RawMark[]>(`*[_type == "activity" && markEligible == true] | order(activityId asc) {
    activityId,
    title,
    "slug": slug.current,
    activityType,
    ratingSystemApplication,
    "pillarTitle": pillar->title,
    "pillarSlug": pillar->slug.current,
    "conceptCode": concept->code,
    "conceptTitle": concept->title,
    "conceptSlug": concept->slug.current,
    "objectiveCode": objective->objectiveCode,
    "objectiveTitle": objective->title,
    "objectiveSlug": objective->slug.current
  }`)

  body.activities = marks.map((m) => ({
    activityId: m.activityId,
    title: m.title,
    url: `${SITE_URL}/${m.pillarSlug}/${m.conceptSlug}/${m.objectiveSlug}/${m.slug}`,
    activityType: m.activityType,
    ratingSystems: ratingSystems(m.ratingSystemApplication),
    pillar: { slug: m.pillarSlug, title: m.pillarTitle },
    concept: { slug: m.conceptSlug, code: m.conceptCode, title: m.conceptTitle },
    objective: { slug: m.objectiveSlug, code: m.objectiveCode, title: m.objectiveTitle },
  }))

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: jsonHeaders(),
  })
}

function jsonHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
    'cache-control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
    'access-control-allow-origin': '*',
  }
}
