import type { APIRoute } from 'astro'
import {
  getNavigationTree,
  listIntroSections,
  listSeals,
  listAppendices,
  listGlossaryTerms,
  listMarkActivities,
} from '@/lib/sanity.queries'

export const prerender = false

const SITE = 'https://standard.seamcertification.org'

function urlEntry(loc: string, priority = 0.5, changefreq = 'monthly') {
  return `  <url><loc>${SITE}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

export const GET: APIRoute = async () => {
  const [navTree, intros, seals, appendices, glossary, marks] = await Promise.all([
    getNavigationTree(),
    listIntroSections(),
    listSeals(),
    listAppendices(),
    listGlossaryTerms(),
    listMarkActivities(),
  ])

  const entries: string[] = []

  // Top-level pages
  entries.push(urlEntry('/', 1.0, 'weekly'))
  entries.push(urlEntry('/intro', 0.8))
  entries.push(urlEntry('/glossary', 0.8))
  entries.push(urlEntry('/bibliography', 0.7))
  entries.push(urlEntry('/appendix', 0.7))
  entries.push(urlEntry('/certification', 0.9))
  entries.push(urlEntry('/seals', 0.9))
  entries.push(urlEntry('/marks', 0.9))

  // Intro sections
  for (const s of intros) entries.push(urlEntry(`/intro/${s.slug}`, 0.7))

  // Appendices
  for (const a of appendices) entries.push(urlEntry(`/appendix/${a.slug}`, 0.6))

  // Glossary deep links
  for (const g of glossary) entries.push(urlEntry(`/glossary#${g.slug}`, 0.4))

  // Rating system overview pages
  for (const rs of ['bid', 'bio', 'omd', 'omo']) {
    entries.push(urlEntry(`/certification/${rs}`, 0.8))
  }

  // Seals
  for (const s of seals) entries.push(urlEntry(`/seals/${s.slug}`, 0.8))

  // Pillars / concepts / objectives / activities
  for (const pillar of navTree) {
    entries.push(urlEntry(`/${pillar.slug}`, 0.8))
    for (const concept of pillar.concepts) {
      entries.push(urlEntry(`/${pillar.slug}/${concept.slug}`, 0.7))
      for (const objective of concept.objectives) {
        entries.push(urlEntry(`/${pillar.slug}/${concept.slug}/${objective.slug}`, 0.7))
        for (const activity of objective.activities) {
          entries.push(urlEntry(`/${pillar.slug}/${concept.slug}/${objective.slug}/${activity.slug}`, 0.6))
        }
      }
    }
  }

  // Marks pages (already covered via activity URLs but include for completeness)
  // The mark-eligible activities are a subset of all activities; no separate URLs.

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=900',
    },
  })
}
