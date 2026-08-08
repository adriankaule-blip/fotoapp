/**
 * Firestore: users (invite-code accounts) and jobs (generation history).
 * Uses ADC — works on Cloud Run via the service account and locally via
 * `gcloud auth application-default login`.
 */

import { FieldValue, Firestore } from '@google-cloud/firestore'

const db = new Firestore()

export type UserDoc = {
  email: string
  name: string
  code: string
  active: boolean
  createdAt: string
  jobCount?: number
  costUsd?: number
}

export type JobDoc = {
  email: string
  mode: string
  style: string
  caption: string
  model: string
  costUsd: number
  createdAt: string
  files: string[]
}

/** Rough per-image generation cost, used for per-user spend tracking. */
export const MODEL_COST_USD: Record<string, number> = { pro: 0.134, flash: 0.039 }

export async function verifyLogin(email: string, code: string): Promise<UserDoc | null> {
  const snap = await db.collection('users').doc(email.toLowerCase().trim()).get()
  if (!snap.exists) return null
  const user = snap.data() as UserDoc
  if (!user.active || user.code !== code.trim()) return null
  return user
}

export async function getUser(email: string): Promise<UserDoc | null> {
  const snap = await db.collection('users').doc(email).get()
  return snap.exists ? (snap.data() as UserDoc) : null
}

export async function recordJob(jobId: string, job: JobDoc): Promise<void> {
  const batch = db.batch()
  batch.set(db.collection('jobs').doc(jobId), job)
  batch.set(
    db.collection('users').doc(job.email),
    { jobCount: FieldValue.increment(1), costUsd: FieldValue.increment(job.costUsd) },
    { merge: true },
  )
  await batch.commit()
}

export async function getJob(jobId: string): Promise<JobDoc | null> {
  const snap = await db.collection('jobs').doc(jobId).get()
  return snap.exists ? (snap.data() as JobDoc) : null
}

export async function listJobs(email: string, limit = 60): Promise<({ id: string } & JobDoc)[]> {
  // No orderBy: equality + orderBy would need a composite index. Sort in
  // memory instead — per-user job counts are small.
  const snap = await db.collection('jobs').where('email', '==', email).limit(500).get()
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as JobDoc) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function upsertUser(user: UserDoc): Promise<void> {
  await db.collection('users').doc(user.email).set(user, { merge: true })
}
