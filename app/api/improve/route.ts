import { NextRequest, NextResponse } from 'next/server'
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

export const runtime = 'nodejs'
export const maxDuration = 120

// Everything happens in memory for the duration of the request — nothing is
// written to disk or stored anywhere.
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Server mangler GEMINI_API_KEY' }, { status: 500 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørgsel' }, { status: 400 })
  }

  const passcode = String(form.get('passcode') || '')
  const expected = process.env.APP_PASSCODE
  if (expected && passcode !== expected) {
    return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })
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

    const dataUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString('base64')}`
    return NextResponse.json({
      improved: dataUrl(after),
      storyCard: dataUrl(story),
      feedCard: dataUrl(feed),
      sideBySide: dataUrl(side),
      model: result.model,
      mode: modeKey,
    })
  } catch (err: any) {
    console.error('improve failed:', err)
    return NextResponse.json({ error: 'Der skete en fejl under genereringen' }, { status: 500 })
  }
}
