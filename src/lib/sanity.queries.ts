import { sanity } from './sanity'
import type { PortableTextBlock } from '@portabletext/types'

function requireClient() {
  if (!sanity) return null
  return sanity
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface PillarRef {
  title: string
  slug: string
  accentColor?: string
  iconUrl?: string
  number: number
}

export interface ConceptRef {
  title: string
  slug: string
  code: string
  number: number
}

export interface ObjectiveRef {
  title: string
  slug: string
  objectiveCode: string
  number: number
  headlineGoal?: string
}

export interface FootnoteRef {
  _id: string
  _type: 'bibliographyEntry' | 'editorialNote'
  number?: number
  marker?: string
  title?: string
  citation?: string
  body?: PortableTextBlock[]
  url?: string
}

export interface SubItem {
  _key: string
  letter: string
  body: PortableTextBlock[]
}

export interface RequirementItem {
  _key: string
  number: number
  body: PortableTextBlock[]
  subItems?: SubItem[]
}

export interface RequirementGroup {
  _key: string
  heading?: string
  headingFootnote?: FootnoteRef
  items: RequirementItem[]
}

export interface DocumentationItem {
  _key: string
  number: number
  body: PortableTextBlock[]
  subItems?: SubItem[]
}

export interface Definition {
  _key: string
  term: string
  appearsInRequirement?: number
  body: PortableTextBlock[]
}

export interface CalculationVariable {
  symbol: string
  meaning: string
}

export interface CalculationStep {
  label?: string
  instructions?: PortableTextBlock[]
  formula?: string
  variables?: CalculationVariable[]
}

export interface CalculationScenario {
  label: string
  description?: PortableTextBlock[]
  steps?: CalculationStep[]
}

export interface Calculation {
  mode: 'single' | 'multi-step' | 'multi-scenario'
  steps?: CalculationStep[]
  scenarios?: CalculationScenario[]
}

export interface Indicators {
  performanceIndicator: PortableTextBlock[]
  contextIndicators?: Array<{ body: PortableTextBlock[] }>
  calculation?: Calculation
}

export interface ScoringBand {
  _key: string
  pointsLabel: string
  criterion: string
}

export interface ScoringRubric {
  criterionLabel: string
  bands: ScoringBand[]
}

export interface ScoringScenario {
  label: string
  rubric: ScoringRubric
}

export interface Scoring {
  outcomeThreshold?: PortableTextBlock[]
  eligibility?: PortableTextBlock[]
  mode: 'single' | 'multi-scenario'
  pointsAssignment?: ScoringRubric
  scenarios?: ScoringScenario[]
  additionalPointsAssignment?: ScoringRubric
  additionalPointsEligibility?: PortableTextBlock[]
  additionalPointsLogic?: 'sum' | 'or'
  notes?: PortableTextBlock[]
}

export type GuidanceSection =
  | { _type: 'guidanceSubsection'; _key: string; heading: string; headingFootnote?: FootnoteRef; body: PortableTextBlock[] }
  | { _type: 'guidanceSteps'; _key: string; heading: string; lead?: PortableTextBlock[]; steps: Array<{ label: string; body: PortableTextBlock[] }> }
  | { _type: 'guidanceResources'; _key: string; heading: string; resources: Array<{ label: string; description?: PortableTextBlock[]; url?: string }> }
  | { _type: 'guidanceExample'; _key: string; heading?: string; body: PortableTextBlock[] }
  | { _type: 'guidanceNote'; _key: string; body: PortableTextBlock[] }
  | { _type: 'guidanceImage'; _key: string; alt: string; caption?: string }

export interface ReferencedSource {
  _key: string
  source: {
    _id: string
    number?: number
    title?: string
    citation: string
    url?: string
    sourceType?: string
  }
  footnote?: FootnoteRef
}

export interface RatingSystemApplication {
  bi_developer?: boolean
  bi_occupier?: boolean
  om_developer?: boolean
  om_occupier?: boolean
  cd?: boolean
}

export interface Activity {
  activityId: string
  title: string
  slug: string
  activityType: 'Driver' | 'Impact'
  ratingSystemApplication?: RatingSystemApplication
  markEligible?: boolean
  /** UN SDG numbers this activity aligns with (per Appendix A). */
  sdgs?: number[]
  /** Seals this activity belongs to (resolved at query time). */
  seals?: Array<{ name: string; slug: string; accentColor?: string }>
  pillar: PillarRef
  concept: ConceptRef
  objective: ObjectiveRef
  scope?: PortableTextBlock[]
  requirementsSectionFootnote?: FootnoteRef
  requirements?: RequirementGroup[]
  requirementsNotes?: PortableTextBlock[]
  indicators?: Indicators
  scoring?: Scoring
  documentationSectionFootnote?: FootnoteRef
  documentationLeadIn?: PortableTextBlock[]
  documentationItems?: DocumentationItem[]
  documentationTemplates?: Array<{
    _key: string
    title: string
    columns: string[]
    exampleRows?: Array<{ _key?: string; cells: string[] }>
    footnote?: string
  }>
  definitions?: Definition[]
  guidance?: GuidanceSection[]
  referencedSources?: ReferencedSource[]
}

// ─── Queries ──────────────────────────────────────────────────────────────

const activityProjection = `{
  activityId,
  title,
  "slug": slug.current,
  activityType,
  ratingSystemApplication,
  markEligible,
  sdgs,
  "seals": *[_type == "seal" && references(^._id)] | order(order asc, name asc) {
    name,
    "slug": slug.current,
    accentColor
  },
  "pillar": pillar->{
    title,
    "slug": slug.current,
    accentColor,
    iconUrl,
    number
  },
  "concept": concept->{
    title,
    "slug": slug.current,
    code,
    number
  },
  "objective": objective->{
    title,
    "slug": slug.current,
    objectiveCode,
    number,
    headlineGoal
  },
  scope,
  "requirementsSectionFootnote": requirementsSectionFootnote->{
    _id, _type, number, marker, title, citation, body
  },
  requirements[]{
    _key,
    heading,
    "headingFootnote": headingFootnote->{_id, _type, number, marker, title, citation, body},
    items[]{
      _key,
      number,
      body,
      subItems[]{ _key, letter, body }
    }
  },
  requirementsNotes,
  indicators{
    performanceIndicator,
    contextIndicators[]{ body },
    calculation
  },
  scoring,
  "documentationSectionFootnote": documentationSectionFootnote->{
    _id, _type, number, marker, title, citation, body
  },
  documentationLeadIn,
  documentationTemplates[]{
    _key,
    title,
    columns,
    exampleRows[]{ _key, cells },
    footnote
  },
  documentationItems[]{
    _key,
    number,
    body,
    subItems[]{ _key, letter, body }
  },
  definitions[]{ _key, term, appearsInRequirement, body },
  guidance[]{
    _key,
    _type,
    heading,
    "headingFootnote": headingFootnote->{_id, _type, number, marker, title, citation, body},
    body,
    lead,
    steps[]{ label, body },
    resources[]{ label, description, url },
    image,
    alt,
    caption
  },
"referencedSources": referencedSources[]{
    _key,
    "source": source->{_id, number, title, citation, url, sourceType},
    "footnote": footnote->{_id, _type, number, marker, title, citation, body}
  }
}`

export async function getActivityBySlug(slug: string): Promise<Activity | null> {
  const client = requireClient()
  if (!client) return null
  const query = `*[_type == "activity" && slug.current == $slug][0]${activityProjection}`
  return client.fetch(query, { slug })
}

// Fetches every bibliography entry + editorial note (we only have a handful).
// Used as a lookup map for inline markdef _refs in Portable Text.
export interface FootnoteLookup {
  bibliographyEntries: Record<string, FootnoteRef>
  editorialNotes: Record<string, FootnoteRef>
  // Map of activityId (e.g. "SJa1.2") → canonical URL path. Optional so callers
  // that don't need cross-activity linking can omit it.
  activityUrls?: Record<string, string>
}

export async function getFootnoteLookup(): Promise<FootnoteLookup> {
  const client = requireClient()
  if (!client) return { bibliographyEntries: {}, editorialNotes: {} }

  const [bibs, notes] = await Promise.all([
    client.fetch<FootnoteRef[]>(`*[_type == "bibliographyEntry"]{ _id, _type, number, title, citation, url }`),
    client.fetch<FootnoteRef[]>(`*[_type == "editorialNote"]{ _id, _type, marker, body }`),
  ])

  return {
    bibliographyEntries: Object.fromEntries(bibs.map((b) => [b._id, b])),
    editorialNotes: Object.fromEntries(notes.map((n) => [n._id, n])),
  }
}

// Walks the activity tree and returns the set of editorial-note _ref strings
// that are actually used (section footnotes + inline editorialNoteRef marks).
export function collectEditorialNoteRefs(activity: Activity): Set<string> {
  const refs = new Set<string>()

  const collectFromFootnote = (fn?: FootnoteRef) => {
    if (fn && fn._type === 'editorialNote' && fn._id) refs.add(fn._id)
  }
  collectFromFootnote(activity.requirementsSectionFootnote)
  collectFromFootnote(activity.documentationSectionFootnote)

  const visitBlocks = (blocks: PortableTextBlock[] | undefined) => {
    if (!blocks) return
    for (const block of blocks) {
      const markDefs = (block as { markDefs?: Array<{ _type?: string; note?: { _ref?: string } }> }).markDefs
      if (!markDefs) continue
      for (const md of markDefs) {
        if (md._type === 'editorialNoteRef' && md.note?._ref) {
          refs.add(md.note._ref)
        }
      }
    }
  }

  visitBlocks(activity.scope)
  visitBlocks(activity.requirementsNotes)
  activity.requirements?.forEach((g) => {
    collectFromFootnote(g.headingFootnote)
    g.items.forEach((it) => {
      visitBlocks(it.body)
      it.subItems?.forEach((s) => visitBlocks(s.body))
    })
  })
  visitBlocks(activity.indicators?.performanceIndicator)
  activity.indicators?.contextIndicators?.forEach((c) => visitBlocks(c.body))
  activity.indicators?.calculation?.steps?.forEach((s) => {
    visitBlocks(s.instructions)
  })
  activity.indicators?.calculation?.scenarios?.forEach((sc) => {
    visitBlocks(sc.description)
    sc.steps?.forEach((s) => visitBlocks(s.instructions))
  })
  visitBlocks(activity.scoring?.outcomeThreshold)
  visitBlocks(activity.scoring?.eligibility)
  visitBlocks(activity.scoring?.notes)
  visitBlocks(activity.scoring?.additionalPointsEligibility)
  visitBlocks(activity.documentationLeadIn)
  activity.documentationItems?.forEach((it) => {
    visitBlocks(it.body)
    it.subItems?.forEach((s) => visitBlocks(s.body))
  })
  activity.definitions?.forEach((d) => visitBlocks(d.body))
  activity.referencedSources?.forEach((rs) => collectFromFootnote(rs.footnote))
  activity.guidance?.forEach((sec) => {
    if (sec._type === 'guidanceSubsection') {
      collectFromFootnote(sec.headingFootnote)
      visitBlocks(sec.body)
    } else if (sec._type === 'guidanceSteps') {
      visitBlocks(sec.lead)
      sec.steps?.forEach((st) => visitBlocks(st.body))
    } else if (sec._type === 'guidanceResources') {
      sec.resources?.forEach((r) => visitBlocks(r.description))
    } else if (sec._type === 'guidanceExample') visitBlocks(sec.body)
    else if (sec._type === 'guidanceNote') visitBlocks(sec.body)
  })

  return refs
}

export async function listActivities(): Promise<Pick<Activity, 'activityId' | 'title' | 'slug'>[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "activity"]{
    activityId,
    title,
    "slug": slug.current
  } | order(activityId asc)`)
}

// ─── Navigation tree ──────────────────────────────────────────────────────

export interface NavActivity {
  activityId: string
  title: string
  slug: string
  activityType: 'Driver' | 'Impact'
  ratingSystemApplication?: RatingSystemApplication
  markEligible?: boolean
  /** Slugs of seals this activity belongs to (joined via reverse reference). */
  sealSlugs?: string[]
}

export interface NavObjective {
  title: string
  slug: string
  objectiveCode: string
  number: number
  activities: NavActivity[]
}

export interface NavConcept {
  title: string
  slug: string
  code: string
  number: number
  objectives: NavObjective[]
}

export interface NavPillar {
  title: string
  slug: string
  number: number
  concepts: NavConcept[]
}

// ─── Pillar landing-page query ────────────────────────────────────────────

export interface PillarDetail {
  title: string
  slug: string
  number: number
  iconUrl?: string
  accentColor?: string
  summary?: string
  concepts: Array<{
    title: string
    slug: string
    code: string
    number: number
    summary?: PortableTextBlock[]
    objectives: Array<{
      title: string
      slug: string
      objectiveCode: string
      number: number
      headlineGoal?: string
      activityCount: number
      activities?: Array<{
        activityId: string
        title: string
        slug: string
        activityType: 'Driver' | 'Impact'
      }>
    }>
    activityCount: number
  }>
}

export async function listPillars(): Promise<PillarDetail[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "pillar"] | order(number asc) {
    title,
    "slug": slug.current,
    number,
    iconUrl,
    accentColor,
    summary,
    "concepts": *[_type == "concept" && pillar._ref == ^._id] | order(number asc) {
      title,
      "slug": slug.current,
      code,
      number,
      "objectives": *[_type == "objective" && concept._ref == ^._id] | order(number asc) {
        title,
        "slug": slug.current,
        objectiveCode,
        number,
        "activityCount": count(*[_type == "activity" && objective._ref == ^._id])
      },
      "activityCount": count(*[_type == "activity" && objective->concept._ref == ^._id])
    }
  }`)
}

export async function getPillarBySlug(pillarSlug: string): Promise<PillarDetail | null> {
  const client = requireClient()
  if (!client) return null
  return client.fetch(
    `*[_type == "pillar" && slug.current == $pillarSlug][0]{
      title,
      "slug": slug.current,
      number,
      iconUrl,
      accentColor,
      summary,
      "concepts": *[_type == "concept" && pillar._ref == ^._id] | order(number asc) {
        title,
        "slug": slug.current,
        code,
        number,
        summary,
        "objectives": *[_type == "objective" && concept._ref == ^._id] | order(number asc) {
          title,
          "slug": slug.current,
          objectiveCode,
          number,
          headlineGoal,
          "activityCount": count(*[_type == "activity" && objective._ref == ^._id]),
          "activities": *[_type == "activity" && objective._ref == ^._id] | order(activityId asc) {
            activityId,
            title,
            "slug": slug.current,
            activityType
          }
        },
        "activityCount": count(*[_type == "activity" && objective->concept._ref == ^._id])
      }
    }`,
    { pillarSlug },
  )
}

// ─── Concept / Objective landing-page queries ─────────────────────────────

export interface ConceptDetail {
  title: string
  slug: string
  code: string
  number: number
  headlineGoal?: string
  summary?: PortableTextBlock[]
  pillar: { title: string; slug: string; number: number; iconUrl?: string }
  objectives: Array<{
    title: string
    slug: string
    objectiveCode: string
    number: number
    headlineGoal?: string
    activities: NavActivity[]
  }>
}

export async function getConceptBySlug(pillarSlug: string, conceptSlug: string): Promise<ConceptDetail | null> {
  const client = requireClient()
  if (!client) return null
  return client.fetch(
    `*[_type == "concept" && slug.current == $conceptSlug && pillar->slug.current == $pillarSlug][0]{
      title,
      "slug": slug.current,
      code,
      number,
      headlineGoal,
      summary,
      "pillar": pillar->{ title, "slug": slug.current, number, iconUrl },
      "objectives": *[_type == "objective" && concept._ref == ^._id] | order(number asc) {
        title,
        "slug": slug.current,
        objectiveCode,
        number,
        headlineGoal,
        "activities": *[_type == "activity" && objective._ref == ^._id] | order(activityId asc) {
          activityId,
          title,
          "slug": slug.current,
          activityType
        }
      }
    }`,
    { pillarSlug, conceptSlug },
  )
}

export interface ObjectiveDetail {
  title: string
  slug: string
  objectiveCode: string
  number: number
  headlineGoal?: string
  narrative?: PortableTextBlock[]
  pillar: { title: string; slug: string; number: number; iconUrl?: string }
  concept: { title: string; slug: string; code: string; number: number }
  activities: Array<NavActivity & { scope?: PortableTextBlock[] }>
}

export async function getObjectiveBySlug(
  pillarSlug: string,
  conceptSlug: string,
  objectiveSlug: string,
): Promise<ObjectiveDetail | null> {
  const client = requireClient()
  if (!client) return null
  return client.fetch(
    `*[_type == "objective" && slug.current == $objectiveSlug && concept->slug.current == $conceptSlug && concept->pillar->slug.current == $pillarSlug][0]{
      title,
      "slug": slug.current,
      objectiveCode,
      number,
      headlineGoal,
      narrative,
      "pillar": concept->pillar->{ title, "slug": slug.current, number, iconUrl },
      "concept": concept->{ title, "slug": slug.current, code, number },
      "activities": *[_type == "activity" && objective._ref == ^._id] | order(activityId asc) {
        activityId,
        title,
        "slug": slug.current,
        activityType,
        scope
      }
    }`,
    { pillarSlug, conceptSlug, objectiveSlug },
  )
}

export async function getNavigationTree(): Promise<NavPillar[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "pillar"] | order(number asc) {
    title,
    "slug": slug.current,
    number,
    "concepts": *[_type == "concept" && pillar._ref == ^._id] | order(number asc) {
      title,
      "slug": slug.current,
      code,
      number,
      "objectives": *[_type == "objective" && concept._ref == ^._id] | order(number asc) {
        title,
        "slug": slug.current,
        objectiveCode,
        number,
        "activities": *[_type == "activity" && objective._ref == ^._id] | order(activityId asc) {
          activityId,
          title,
          "slug": slug.current,
          activityType,
          ratingSystemApplication,
          markEligible,
          "sealSlugs": *[_type == "seal" && references(^._id)].slug.current
        }
      }
    }
  }`)
}

// Flat ordered list of every activity in the standard, with its canonical URL.
// Used for prev/next navigation and cross-activity link resolution.
export interface FlatActivity {
  activityId: string
  title: string
  slug: string
  url: string
}

export function flattenActivities(tree: NavPillar[]): FlatActivity[] {
  const out: FlatActivity[] = []
  for (const pillar of tree) {
    for (const concept of pillar.concepts) {
      for (const objective of concept.objectives) {
        for (const activity of objective.activities) {
          out.push({
            activityId: activity.activityId,
            title: activity.title,
            slug: activity.slug,
            url: `/${pillar.slug}/${concept.slug}/${objective.slug}/${activity.slug}`,
          })
        }
      }
    }
  }
  return out
}

export function buildActivityUrlMap(tree: NavPillar[]): Record<string, string> {
  return Object.fromEntries(flattenActivities(tree).map((a) => [a.activityId, a.url]))
}

export function findPrevNext(
  slug: string,
  flat: FlatActivity[],
): { prev?: FlatActivity; next?: FlatActivity } {
  const i = flat.findIndex((a) => a.slug === slug)
  if (i === -1) return {}
  return { prev: i > 0 ? flat[i - 1] : undefined, next: i < flat.length - 1 ? flat[i + 1] : undefined }
}

// ─── Appendices ───────────────────────────────────────────────────────────

export interface AppendixSummary {
  code: string
  title: string
  slug: string
}

export interface AppendixDetail extends AppendixSummary {
  body?: PortableTextBlock[]
}

export async function listAppendices(): Promise<AppendixSummary[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "appendix"] | order(code asc) {
    code,
    title,
    "slug": slug.current
  }`)
}

export async function getAppendixBySlug(slug: string): Promise<AppendixDetail | null> {
  const client = requireClient()
  if (!client) return null
  return client.fetch(
    `*[_type == "appendix" && slug.current == $slug][0]{
      code,
      title,
      "slug": slug.current,
      body
    }`,
    { slug },
  )
}

// ─── Intro sections + glossary ────────────────────────────────────────────

export interface IntroSection {
  title: string
  slug: string
  order: number
  summary?: string
  body: PortableTextBlock[]
}

export async function listIntroSections(): Promise<IntroSection[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "introSection"] | order(order asc) {
    title,
    "slug": slug.current,
    order,
    summary
  }`)
}

export async function getIntroSectionBySlug(slug: string): Promise<IntroSection | null> {
  const client = requireClient()
  if (!client) return null
  return client.fetch(
    `*[_type == "introSection" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      order,
      summary,
      body
    }`,
    { slug },
  )
}

// ─── Landing-page query ───────────────────────────────────────────────────

export interface LandingActivity {
  activityId: string
  title: string
  slug: string
  activityType: 'Driver' | 'Impact'
  ratingSystemApplication?: RatingSystemApplication
  markEligible?: boolean
  sealSlugs?: string[]
}

export interface LandingObjective {
  title: string
  slug: string
  objectiveCode: string
  number: number
  headlineGoal?: string
  activities: LandingActivity[]
}

export interface LandingConcept {
  title: string
  slug: string
  code: string
  number: number
  headlineGoal?: string
  objectives: LandingObjective[]
}

export interface LandingPillar {
  title: string
  slug: string
  number: number
  iconUrl?: string
  summary?: string
  concepts: LandingConcept[]
}

export async function getLandingData(): Promise<LandingPillar[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "pillar"] | order(number asc) {
    title,
    "slug": slug.current,
    number,
    iconUrl,
    summary,
    "concepts": *[_type == "concept" && pillar._ref == ^._id] | order(number asc) {
      title,
      "slug": slug.current,
      code,
      number,
      headlineGoal,
      "objectives": *[_type == "objective" && concept._ref == ^._id] | order(number asc) {
        title,
        "slug": slug.current,
        objectiveCode,
        number,
        headlineGoal,
        "activities": *[_type == "activity" && objective._ref == ^._id] | order(activityId asc) {
          activityId,
          title,
          "slug": slug.current,
          activityType,
          ratingSystemApplication,
          markEligible,
          "sealSlugs": *[_type == "seal" && references(^._id)].slug.current
        }
      }
    }
  }`)
}

// ─── Seals + Marks ────────────────────────────────────────────────────────

export interface SealSummary {
  name: string
  slug: string
  order?: number
  summary?: string
  accentColor?: string
  activityCount: number
}

export interface SealDetail extends SealSummary {
  body?: PortableTextBlock[]
  activities: Array<{
    activityId: string
    title: string
    slug: string
    activityType: 'Driver' | 'Impact'
    pillarSlug: string
    conceptSlug: string
    objectiveSlug: string
  }>
}

/** Normalize legacy uppercase "SEAL" in Sanity-stored names. */
function normalizeSealName<T extends { name?: string }>(s: T): T {
  if (s && typeof s.name === 'string') {
    s.name = s.name.replace(/\bSEAL\b/g, 'Seal').replace(/\bSEALs\b/g, 'Seals')
  }
  return s
}

export async function listSeals(): Promise<SealSummary[]> {
  const client = requireClient()
  if (!client) return []
  const seals = await client.fetch<SealSummary[]>(`*[_type == "seal"] | order(order asc, name asc) {
    name,
    "slug": slug.current,
    order,
    summary,
    accentColor,
    "activityCount": count(activities)
  }`)
  return seals.map(normalizeSealName)
}

export async function getSealBySlug(slug: string): Promise<SealDetail | null> {
  const client = requireClient()
  if (!client) return null
  const seal = await client.fetch<SealDetail | null>(
    `*[_type == "seal" && slug.current == $slug][0]{
      name,
      "slug": slug.current,
      order,
      summary,
      accentColor,
      body,
      "activityCount": count(activities),
      "activities": activities[]->{
        activityId,
        title,
        "slug": slug.current,
        activityType,
        "pillarSlug": pillar->slug.current,
        "conceptSlug": concept->slug.current,
        "objectiveSlug": objective->slug.current
      }
    }`,
    { slug },
  )
  return seal ? normalizeSealName(seal) : null
}

export interface MarkActivity {
  activityId: string
  title: string
  slug: string
  activityType: 'Driver' | 'Impact'
  pillarSlug: string
  pillarTitle: string
  conceptSlug: string
  objectiveSlug: string
}

export async function listMarkActivities(): Promise<MarkActivity[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "activity" && markEligible == true] | order(activityId asc) {
    activityId,
    title,
    "slug": slug.current,
    activityType,
    "pillarSlug": pillar->slug.current,
    "pillarTitle": pillar->title,
    "conceptSlug": concept->slug.current,
    "objectiveSlug": objective->slug.current
  }`)
}

export interface GlossaryEntry {
  term: string
  slug: string
  body: PortableTextBlock[]
}

export async function listGlossaryTerms(): Promise<GlossaryEntry[]> {
  const client = requireClient()
  if (!client) return []
  return client.fetch(`*[_type == "glossaryTerm"] | order(term asc) {
    term,
    "slug": slug.current,
    body
  }`)
}
