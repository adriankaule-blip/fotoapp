/**
 * GCS persistence for job images. Private bucket; images are served through
 * the authenticated /api/file proxy, never public URLs.
 */

import { Storage } from '@google-cloud/storage'

const storage = new Storage()

function bucket() {
  const name = process.env.GCS_BUCKET
  if (!name) throw new Error('GCS_BUCKET is not set')
  return storage.bucket(name)
}

export const JOB_FILES = ['original.jpg', 'efter.jpg', 'story.jpg', 'feed.jpg', 'side.jpg'] as const
export type JobFileName = (typeof JOB_FILES)[number]

export async function saveJobFiles(jobId: string, files: Partial<Record<JobFileName, Buffer>>): Promise<string[]> {
  const names = Object.keys(files) as JobFileName[]
  await Promise.all(
    names.map(name =>
      bucket().file(`jobs/${jobId}/${name}`).save(files[name]!, { contentType: 'image/jpeg', resumable: false }),
    ),
  )
  return names
}

export async function readJobFile(jobId: string, name: JobFileName): Promise<Buffer> {
  const [buf] = await bucket().file(`jobs/${jobId}/${name}`).download()
  return buf
}
