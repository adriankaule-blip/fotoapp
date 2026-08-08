import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { MODEL_COST_USD, recordJob } from '../../../lib/db'
import {
  composeFeedCard,
  composeSideBySide,
  composeStoryCard,
  generateWithRetry,
  modelChain,
  prepInput,
  watermarkAfter,
} from '../../../lib/engine'
import { MODES, STYLES, buildPrompt, captionFor } from '../../../lib/styles'
import { saveJobFiles } from '../../../lib/storage'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Server mangler GEMINI_API_KEY' }, { status: 500 })

  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Log ind først' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørgsel' }, { status: 400 })
  }

  const modeKey = String(form.get('mode') || 'renovering')
  const mode = MODES[modeKey]
  if (!mode) return NextResponse.json({ error: 'Ukendt tilstand' }, { status: 400 })

  const styleKey = String(form.get('style') || 'klassisk')
  if (mode.usesStyle && !STYLES[styleKey]) return NextResponse.json({ error: 'Ukendt stil' }, { status: 400 })

  const caption = String(form.get('caption') || '').slice(0, 120) || captionFor(modeKey, styleKey)

  const file = form.get('image')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Intet billede modtaget' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Billedet er for stort (max 8 MB)' }, { status: 413 })

  try {
    const original = Buffer.from(await file.arrayBuffer())
    const prepped = await prepInput(original)
    const result = await generateWithRetry(apiKey, modelChain('auto'), prepped, buildPrompt(modeKey, styleKey), [15_000])
    if (!result) return NextResponse.json({ error: 'Genereringen mislykkedes — prøv igen om lidt' }, { status: 502 })

    const [story, feed, side, after] = await Promise.all([
      composeStoryCard(prepped, result.buffer, caption),
      composeFeedCard(prepped, result.buffer, caption),
      composeSideBySide(prepped, result.buffer),
      watermarkAfter(result.buffer),
    ])

    // Persist for the user's history; a storage failure must not lose the
    // result the user is waiting on.
    const jobId = randomUUID()
    try {
      const files = await saveJobFiles(jobId, {
        'original.jpg': prepped,
        'efter.jpg': after,
        'story.jpg': story,
        'feed.jpg': feed,
        'side.jpg': side,
      })
      await recordJob(jobId, {
        email: session.email,
        mode: modeKey,
        style: mode.usesStyle ? styleKey : '',
        caption,
        model: result.model,
        costUsd: MODEL_COST_USD[result.model] ?? 0.134,
        createdAt: new Date().toISOString(),
        files,
      })
    } catch (err) {
      console.error(`persist failed for job ${jobId}:`, err)
    }

    const dataUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString('base64')}`
    return NextResponse.json({
      improved: dataUrl(after),
      storyCard: dataUrl(story),
      feedCard: dataUrl(feed),
      sideBySide: dataUrl(side),
      model: result.model,
      mode: modeKey,
      jobId,
    })
  } catch (err: any) {
    console.error('improve failed:', err)
    return NextResponse.json({ error: 'Der skete en fejl under genereringen' }, { status: 500 })
  }
}
