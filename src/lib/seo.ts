/**
 * Helpers for building Schema.org JSON-LD documents used across the site.
 * Keep these small and explicit — the JSON-LD ends up in the HTML so every
 * extra field is bytes shipped to every visitor.
 */

const SITE_URL = 'https://standard.seamcertification.org'
const PUBLISHER = {
  '@type': 'Organization',
  name: 'SEAM, Inc.',
  url: 'https://www.seamcertification.org',
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/seam-wordmark.svg`,
  },
} as const

export function abs(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function organization() {
  return { '@context': 'https://schema.org', ...PUBLISHER }
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The SEAM Standard',
    url: SITE_URL,
    description: 'The digital reference for the SEAM Standard — pillars, concepts, objectives, and activities for advancing social equity in commercial real estate.',
    publisher: PUBLISHER,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbs(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  }
}

export function article(args: {
  headline: string
  description?: string
  path: string
  section?: string
  image?: string
  about?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: args.headline,
    description: args.description,
    url: abs(args.path),
    mainEntityOfPage: abs(args.path),
    inLanguage: 'en',
    isAccessibleForFree: true,
    publisher: PUBLISHER,
    author: PUBLISHER,
    image: args.image ? abs(args.image) : `${SITE_URL}/og-default.png`,
    articleSection: args.section,
    about: args.about,
  }
}

export function definedTerm(args: {
  name: string
  description: string
  path: string
  inSet?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: args.name,
    description: args.description,
    url: abs(args.path),
    inDefinedTermSet: args.inSet,
  }
}

export function definedTermSet(args: {
  name: string
  path: string
  terms: Array<{ name: string; description: string; path: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: args.name,
    url: abs(args.path),
    publisher: PUBLISHER,
    hasDefinedTerm: args.terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.name,
      description: t.description,
      url: abs(t.path),
    })),
  }
}

export function collectionPage(args: {
  name: string
  description?: string
  path: string
  hasPart?: Array<{ name: string; path: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    description: args.description,
    url: abs(args.path),
    publisher: PUBLISHER,
    inLanguage: 'en',
    hasPart: args.hasPart?.map((p) => ({
      '@type': 'WebPage',
      name: p.name,
      url: abs(p.path),
    })),
  }
}

export function itemList(args: {
  name: string
  description?: string
  path: string
  items: Array<{ name: string; path: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: args.name,
    description: args.description,
    url: abs(args.path),
    numberOfItems: args.items.length,
    itemListElement: args.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  }
}
