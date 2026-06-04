#!/usr/bin/env node
/**
 * Bulk-set the marketingTitle field on activities by activityId.
 *
 * Usage: SANITY_STUDIO_PROJECT_ID=... SANITY_AUTH_TOKEN=... \
 *        node scripts/set-marketing-titles.mjs
 *
 * Patches BOTH the published doc and any draft, so editors' in-flight
 * drafts don't overwrite the marketing title on publish.
 */
import { createClient } from '@sanity/client'

const titles = {
  'CIa1.2': 'Community Service',
  'HRa2.1': 'Living Wage Employer',
  'HRa2.3': 'Living Wage Suppliers',
  'IAa2.4': 'Community Voice',
  'SJa1.1': 'Fair Supplier Procurement',
  'SJa2.2': 'Respectful Workplace',
  'SJa2.4': 'Equal Pay: Gender',
  'SJa2.5': 'Equal Pay: All People',
  'TGa3.1': 'Responsible Construction Governance',
  'TGa3.2': 'Responsible Operations Governance',
}

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
  // Include drafts in queries so we can patch both published and draft docs.
  perspective: 'raw',
})

let updated = 0
let missing = []

for (const [activityId, marketingTitle] of Object.entries(titles)) {
  // Fetch every doc with this activityId (published + draft, if any).
  const docs = await client.fetch(
    `*[_type == "activity" && activityId == $id]{_id, title, marketingTitle}`,
    { id: activityId },
  )
  if (!docs.length) {
    missing.push(activityId)
    console.log(`MISS ${activityId} (no document found)`)
    continue
  }
  for (const doc of docs) {
    const previous = doc.marketingTitle ?? '(none)'
    if (previous === marketingTitle) {
      console.log(`SKIP ${activityId} → ${doc._id} already set to "${marketingTitle}"`)
      continue
    }
    await client.patch(doc._id).set({ marketingTitle }).commit()
    console.log(`SET  ${activityId} → ${doc._id}  "${previous}" → "${marketingTitle}"`)
    updated++
  }
}

console.log('')
console.log(`Done. ${updated} document(s) patched.${missing.length ? ` Missing: ${missing.join(', ')}` : ''}`)
