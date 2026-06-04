#!/usr/bin/env node
/**
 * Set markCombinedWith on activities — the inverse side of markPrerequisites.
 * When set, the activity is shown as Mark-eligible on the digital Standard but
 * with a notation that it's earned in combination with the linked activity,
 * and it's hidden from the standalone Marks listing.
 */
import { createClient } from '@sanity/client'

const updates = [
  {
    activityId: 'CIa1.1',
    combinedWithActivityId: 'CIa1.2',
    ensureMarkEligible: true,
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
    console.log(`MISS ${u.activityId}`)
    continue
  }
  const others = await fetchByActivityId(u.combinedWithActivityId)
  if (!others.length) {
    console.log(`MISS combined-with ${u.combinedWithActivityId}`)
    continue
  }
  const published = others.find((d) => !d._id.startsWith('drafts.')) ?? others[0]
  const ref = { _type: 'reference', _ref: published._id }

  for (const t of targets) {
    const patchSet = { markCombinedWith: ref }
    if (u.ensureMarkEligible) patchSet.markEligible = true
    await client.patch(t._id).set(patchSet).commit()
    console.log(`SET  ${u.activityId} → ${t._id}  markCombinedWith=${u.combinedWithActivityId}${u.ensureMarkEligible ? ', markEligible=true' : ''}`)
  }
}

console.log('\nDone.')
