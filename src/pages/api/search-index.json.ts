import type { APIRoute } from 'astro'
import { getSanity } from '@/lib/sanity'
import type { PortableTextBlock } from '@portabletext/types'

export const prerender = false

type IndexEntry = {
  type: 'activity' | 'intro' | 'glossary'
  id: string
  title: string
  subtitle?: string
  url: string
  excerpt?: string
}

// Plain-text excerpt of a Portable Text body for indexing.
function pt2text(blocks?: PortableTextBlock[], max = 280): string {
  if (!blocks) return ''
  const out: string[] = []
  for (const b of blocks) {
    const children = (b as { children?: Array<{ text?: string }> }).children
    if (children) {
      out.push(children.map((c) => c.text ?? '').join(''))
    }
    if (out.join(' ').length > max) break
  }
  return out.join(' ').slice(0, max)
}

export const GET: APIRoute = async () => {
  const sanity = getSanity()
  if (!sanity) {
    return new Response(JSON.stringify({ entries: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const [activities, intros, glossary] = await Promise.all([
    sanity.fetch<Array<{
      activityId: string
      title: string
      slug: string
      pillarSlug: string
      conceptSlug: string
      objectiveSlug: string
      activityType: 'Driver' | 'Impact'
      scope?: PortableTextBlock[]
    }>>(`*[_type == "activity"] | order(activityId asc) {
      activityId,
      title,
      "slug": slug.current,
      "pillarSlug": pillar->slug.current,
      "conceptSlug": concept->slug.current,
      "objectiveSlug": objective->slug.current,
      activityType,
      scope
    }`),
    sanity.fetch<Array<{
      title: string
      slug: string
      summary?: string
      body?: PortableTextBlock[]
    }>>(`*[_type == "introSection"] | order(order asc) {
      title,
      "slug": slug.current,
      summary,
      body
    }`),
    sanity.fetch<Array<{ term: string; slug: string; body?: PortableTextBlock[] }>>(
      `*[_type == "glossaryTerm"] | order(term asc) { term, "slug": slug.current, body }`,
    ),
  ])

  const entries: IndexEntry[] = [
    ...activities.map((a) => ({
      type: 'activity' as const,
      id: a.activityId,
      title: a.title,
      subtitle: `${a.activityId} · ${a.activityType}`,
      url: `/${a.pillarSlug}/${a.conceptSlug}/${a.objectiveSlug}/${a.slug}`,
      excerpt: pt2text(a.scope),
    })),
    ...intros.map((s) => ({
      type: 'intro' as const,
      id: s.slug,
      title: s.title,
      subtitle: 'Introduction',
      url: `/intro/${s.slug}`,
      excerpt: s.summary ?? pt2text(s.body),
    })),
    ...glossary.map((g) => ({
      type: 'glossary' as const,
      id: g.slug,
      title: g.term,
      subtitle: 'Definition',
      url: `/glossary#${g.slug}`,
      excerpt: pt2text(g.body),
    })),
  ]

  return new Response(JSON.stringify({ entries }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  })
}
