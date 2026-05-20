import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html'
import type { PortableTextBlock } from '@portabletext/types'
import type { FootnoteLookup } from './sanity.queries'

/**
 * Renders a Portable Text block array to HTML, with custom handling for:
 *  - bibliographyRef:  numbered superscript citation
 *  - editorialNoteRef: lowercase-roman superscript editorial note
 *  - activityRef:      cross-activity link (rendered as plain text for now)
 *  - requirementRef:   in-activity requirement cross-reference
 *  - link:             external URL
 */
export function renderPT(blocks: PortableTextBlock[] | undefined, lookup: FootnoteLookup): string {
  if (!blocks || blocks.length === 0) return ''

  const components: Partial<PortableTextHtmlComponents> = {
    marks: {
      link: ({ value, text }) => {
        const href = (value as { href?: string })?.href ?? '#'
        return `<a href="${escapeAttr(href)}" class="text-seam-600 underline underline-offset-2 hover:text-seam-700" target="_blank" rel="noopener noreferrer">${text}</a>`
      },
      bibliographyRef: ({ value, text }) => {
        const ref = (value as { entry?: { _ref?: string } })?.entry?._ref
        const entry = ref ? lookup.bibliographyEntries[ref] : undefined
        const n = entry?.number ?? '?'
        return `${text}<sup><a href="/bibliography#bib-${n}" class="text-seam-600 hover:text-seam-700">${n}</a></sup>`
      },
      editorialNoteRef: ({ value, text }) => {
        const ref = (value as { note?: { _ref?: string } })?.note?._ref
        const note = ref ? lookup.editorialNotes[ref] : undefined
        const marker = note?.marker ?? '?'
        return `${text}<sup><a href="#note-${marker}" class="text-seam-600 hover:text-seam-700">${marker}</a></sup>`
      },
      activityRef: ({ text }) => {
        // For first pass: just render as plain text. URL resolution requires another query.
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

  return toHTML(blocks, { components })
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
