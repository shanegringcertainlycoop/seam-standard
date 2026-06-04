#!/usr/bin/env node
/**
 * Set markPrerequisites on activities and optionally toggle markEligible on
 * the prerequisite (to remove it from standalone Marks).
 *
 * Usage: SANITY_STUDIO_PROJECT_ID=... SANITY_AUTH_TOKEN=... \
 *        node scripts/set-mark-prereqs.mjs
 */
import { createClient } from '@sanity/client'

/**
 * Each entry sets `markPrerequisites` on `activityId` to reference each prereq,
 * and (when `unmarkPrereqs: true`) clears `markEligible` on each prereq so it
 * no longer appears as a standalone Mark.
 */
const updates = [
  {
    activityId: 'CIa1.2',
    prereqActivityIds: ['CIa1.1'],
    unmarkPrereqs: true,
  },
]

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

if (!projectId) throw new Error('Missing SANITY_STUDIO_PROJECT_ID')
if (!token) throw new Error('Missing SANITY_AUTH_TOKEN')

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'raw',
})

async function fetchByActivityId(activityId) {
  return client.fetch(
    `*[_type == "activity" && activityId == $id]{_id, activityId, markEligible}`,
    { id: activityId },
  )
}

for (const u of updates) {
  const targets = await fetchByActivityId(u.activityId)
  if (!targets.length) {
    console.log(`MISS ${u.activityId} (no document)`)
    continue
  }

  // Resolve prereq references
  const prereqRefs = []
  for (const pid of u.prereqActivityIds) {
    const docs = await fetchByActivityId(pid)
    if (!docs.length) {
      console.log(`  MISS prereq ${pid} (no document)`)
      continue
    }
    // Prefer the published _id over the draft _id (drafts.X) for the reference.
    const published = docs.find((d) => !d._id.startsWith('drafts.'))
    const ref = published ?? docs[0]
    prereqRefs.push({ _type: 'reference', _ref: ref._id, _key: `prereq-${pid.replace(/\./g, '-')}` })
  }

  if (!prereqRefs.length) continue

  for (const target of targets) {
    await client.patch(target._id).set({ markPrerequisites: prereqRefs }).commit()
    console.log(`SET  ${u.activityId} → ${target._id}  prerequisites: [${u.prereqActivityIds.join(', ')}]`)
  }

  if (u.unmarkPrereqs) {
    for (const pid of u.prereqActivityIds) {
      const docs = await fetchByActivityId(pid)
      for (const doc of docs) {
        if (doc.markEligible === false) {
          console.log(`SKIP ${pid} → ${doc._id} already markEligible=false`)
          continue
        }
        await client.patch(doc._id).set({ markEligible: false }).commit()
        console.log(`SET  ${pid} → ${doc._id}  markEligible: true → false`)
      }
    }
  }
}

console.log('\nDone.')
