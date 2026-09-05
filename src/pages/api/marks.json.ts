import type { APIRoute } from 'astro'
import { getSanity } from '@/lib/sanity'
import type { RatingSystemApplication } from '@/lib/sanity.queries'

export const prerender = false

const SITE_URL = 'https://standard.seamcertification.org'

type RawMark = {
  activityId: string
  title: string
  marketingTitle?: string
  slug: string
  activityType: 'Driver' | 'Impact'
  ratingSystemApplication?: RatingSystemApplication
  sdgs?: number[]
  pillarTitle: string
  pillarSlug: string
  conceptCode: string
  conceptTitle: string
  conceptSlug: string
  objectiveCode: string
  objectiveTitle: string
  objectiveSlug: string
  prerequisites?: Array<{ activityId: string; title: string; marketingTitle?: string; slug: string; pillarSlug: string; conceptSlug: string; objectiveSlug: string }>
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
  const sanity = getSanity()
  const body = {
    generatedAt: new Date().toISOString(),
    source: SITE_URL,
    activities: [] as Array<{
      activityId: string
      title: string
      marketingTitle?: string
      displayTitle: string
      url: string
      activityType: 'Driver' | 'Impact'
      ratingSystems: string[]
      sdgs: number[]
      pillar: { slug: string; title: string }
      concept: { slug: string; code: string; title: string }
      objective: { slug: string; code: string; title: string }
      prerequisites?: Array<{ activityId: string; displayTitle: string; url: string }>
    }>,
  }

  if (!sanity) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: jsonHeaders(),
    })
  }

  const marks = await sanity.fetch<RawMark[]>(`*[_type == "activity" && markEligible == true && !defined(markCombinedWith)] | order(activityId asc) {
    activityId,
    title,
    marketingTitle,
    "slug": slug.current,
    activityType,
    ratingSystemApplication,
    sdgs,
    "pillarTitle": pillar->title,
    "pillarSlug": pillar->slug.current,
    "conceptCode": concept->code,
    "conceptTitle": concept->title,
    "conceptSlug": concept->slug.current,
    "objectiveCode": objective->objectiveCode,
    "objectiveTitle": objective->title,
    "objectiveSlug": objective->slug.current,
    "prerequisites": markPrerequisites[]->{
      activityId,
      title,
      marketingTitle,
      "slug": slug.current,
      "pillarSlug": pillar->slug.current,
      "conceptSlug": concept->slug.current,
      "objectiveSlug": objective->slug.current
    }
  }`)

  body.activities = marks.map((m) => ({
    activityId: m.activityId,
    title: m.title,
    marketingTitle: m.marketingTitle,
    displayTitle: m.marketingTitle?.trim() || m.title,
    url: `${SITE_URL}/${m.pillarSlug}/${m.conceptSlug}/${m.objectiveSlug}/${m.slug}`,
    activityType: m.activityType,
    ratingSystems: ratingSystems(m.ratingSystemApplication),
    sdgs: m.sdgs ?? [],
    pillar: { slug: m.pillarSlug, title: m.pillarTitle },
    concept: { slug: m.conceptSlug, code: m.conceptCode, title: m.conceptTitle },
    objective: { slug: m.objectiveSlug, code: m.objectiveCode, title: m.objectiveTitle },
    prerequisites: m.prerequisites?.length
      ? m.prerequisites.map((p) => ({
          activityId: p.activityId,
          displayTitle: p.marketingTitle?.trim() || p.title,
          url: `${SITE_URL}/${p.pillarSlug}/${p.conceptSlug}/${p.objectiveSlug}/${p.slug}`,
        }))
      : undefined,
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
