import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html'
import type { PortableTextBlock } from '@portabletext/types'
import type { FootnoteLookup } from './sanity.queries'

export function renderPT(blocks: PortableTextBlock[] | undefined, lookup: FootnoteLookup): string {
  if (!blocks || blocks.length === 0) return ''

  const components: Partial<PortableTextHtmlComponents> = {
    marks: {
      link: ({ value, text }) => {
        const href = (value as { href?: string })?.href ?? '#'
        return `<a href="${escapeAttr(href)}" class="text-seam-600 underline underline-offset-2 hover:text-seam-700" target="_blank" rel="noopener noreferrer">${text}</a>`
      },
      bibliographyRef: ({ value, text }) => {
        const ref = (value as { entry?: { _ref?: string }; note?: { _ref?: string } })?.entry?._ref
          ?? (value as { note?: { _ref?: string } })?.note?._ref
        const entry = ref ? lookup.bibliographyEntries[ref] : undefined
        const n = entry?.number ?? '?'
        return `${text}<sup><a href="/bibliography#bib-${n}" class="text-seam-600 hover:text-seam-700">${n}</a></sup>`
      },
      editorialNoteRef: ({ value, text }) => {
        // Accept either `note._ref` (schema-canonical) or `entry._ref` (used by some seed scripts).
        const ref = (value as { note?: { _ref?: string } })?.note?._ref
          ?? (value as { entry?: { _ref?: string } })?.entry?._ref
        const note = ref ? lookup.editorialNotes[ref] : undefined
        const marker = note?.marker ?? '?'
        return `${text}<sup><a href="#note-${marker}" class="text-seam-600 hover:text-seam-700">${marker}</a></sup>`
      },
      activityRef: ({ value, text }) => {
        const id = (value as { activityId?: string })?.activityId
        const url = id ? lookup.activityUrls?.[id] : undefined
        if (url) {
          return `<a href="${escapeAttr(url)}" class="font-medium text-seam-600 underline underline-offset-2 hover:text-seam-700">${text}</a>`
        }
        return `<span class="font-medium">${text}</span>`
      },
      requirementRef: ({ value, text }) => {
        const n = (value as { requirementNumber?: number })?.requirementNumber
        const sub = (value as { subItem?: string })?.subItem
        const label = sub ? `${n}.${sub}` : `${n}`
        return `${text || `Requirement ${label}`}`
      },
    },
    block: {
      normal: ({ children }) => `<p class="mb-3 leading-relaxed text-warm-800">${children}</p>`,
      h3: ({ children }) => `<h3 class="mt-6 mb-2 text-lg font-medium text-seam-800">${children}</h3>`,
      h4: ({ children }) => `<h4 class="mt-4 mb-2 text-base font-medium text-gold-500">${children}</h4>`,
    },
    list: {
      bullet: ({ children }) => `<ul class="ml-6 mb-3 list-disc space-y-1 text-warm-800 [&_ul]:mt-1 [&_ol]:mt-1">${children}</ul>`,
      number: ({ children }) => `<ol class="ml-6 mb-3 list-decimal space-y-1 text-warm-800 [&_ul]:mt-1 [&_ol]:mt-1">${children}</ol>`,
    },
    listItem: {
      bullet: ({ children }) => `<li class="pl-1">${children}</li>`,
      number: ({ children }) => `<li class="pl-1">${children}</li>`,
    },
  }

  const html = toHTML(blocks, { components })
  return postProcess(html, lookup)
}

// Auto-linkifies bare URLs and "Activity XXa#.#" patterns, skipping content
// inside existing <a> tags to avoid double-wrapping.
const URL_RE = /(https?:\/\/[^\s<>()"]+[^\s<>()".,;:!?])/g
const ACTIVITY_RE = /\bActivity\s+([A-Z]{2}a[0-9]+(?:\.[0-9]+)?)\b/g

function postProcess(html: string, lookup: FootnoteLookup): string {
  return splitOnAnchors(html)
    .map((seg) => (seg.isAnchor ? seg.text : linkify(seg.text, lookup)))
    .join('')
}

function linkify(s: string, lookup: FootnoteLookup): string {
  let out = s.replace(URL_RE, (url) =>
    `<a href="${escapeAttr(url)}" class="text-seam-600 underline underline-offset-2 hover:text-seam-700" target="_blank" rel="noopener noreferrer">${url}</a>`,
  )
  out = out.replace(ACTIVITY_RE, (match, id) => {
    const url = lookup.activityUrls?.[id]
    return url
      ? `<a href="${escapeAttr(url)}" class="font-medium text-seam-600 hover:text-seam-700">${match}</a>`
      : match
  })
  return out
}

// Splits HTML into anchor-segments (passthrough) and non-anchor text (linkifiable).
function splitOnAnchors(html: string): Array<{ isAnchor: boolean; text: string }> {
  const re = /<a\b[^>]*>[\s\S]*?<\/a>/gi
  const parts: Array<{ isAnchor: boolean; text: string }> = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) parts.push({ isAnchor: false, text: html.slice(last, m.index) })
    parts.push({ isAnchor: true, text: m[0] })
    last = m.index + m[0].length
  }
  if (last < html.length) parts.push({ isAnchor: false, text: html.slice(last) })
  return parts
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
