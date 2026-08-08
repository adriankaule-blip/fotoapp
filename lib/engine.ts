/**
 * Server-side engine: Gemini image generation + story card composition.
 * Works entirely on Buffers — no filesystem access — so it can run in a
 * stateless web request as well as from the CLI.
 */

import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'

export const PRO_MODEL = 'gemini-3-pro-image'
export const FLASH_MODEL = 'gemini-3.1-flash-image'

export type ModelSpec = { name: string; label: string }

export function modelChain(choice: 'pro' | 'flash' | 'auto'): ModelSpec[] {
  if (choice === 'flash') return [{ name: FLASH_MODEL, label: 'flash' }]
  if (choice === 'pro') return [{ name: PRO_MODEL, label: 'pro' }]
  return [{ name: PRO_MODEL, label: 'pro' }, { name: FLASH_MODEL, label: 'flash' }]
}

/** Downscale input to max 2048px JPEG for the API call. */
export async function prepInput(input: Buffer | string): Promise<Buffer> {
  return sharp(input).rotate().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer()
}

async function tryGenerate(
  ai: GoogleGenAI,
  modelName: string,
  base64: string,
  prompt: string,
  label: string,
): Promise<Buffer | null> {
  const res = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: prompt }] }],
    config: { responseModalities: ['TEXT', 'IMAGE'] },
  })

  const parts = res.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.text) console.log(`  [${label}] ${part.text.slice(0, 200)}`)
  }
  for (const part of parts) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, 'base64')
  }
  console.warn(`  [${label}] No image returned. Finish reason: ${res.candidates?.[0]?.finishReason}`)
  return null
}

export async function generateWithRetry(
  apiKey: string,
  models: ModelSpec[],
  imageJpeg: Buffer,
  prompt: string,
  backoffs: number[] = [30_000, 60_000],
): Promise<{ buffer: Buffer; model: string } | null> {
  const ai = new GoogleGenAI({ apiKey })
  const base64 = imageJpeg.toString('base64')
  for (const { name, label } of models) {
    for (let attempt = 0; attempt <= backoffs.length; attempt++) {
      try {
        console.log(`  Trying ${label}${attempt > 0 ? ` (retry ${attempt})` : ''}...`)
        const start = Date.now()
        const buffer = await tryGenerate(ai, name, base64, prompt, label)
        const elapsed = ((Date.now() - start) / 1000).toFixed(1)
        if (buffer) {
          console.log(`  ✓ ${label} succeeded in ${elapsed}s (${(buffer.length / 1024).toFixed(0)} KB)`)
          return { buffer, model: label }
        }
        break // no image but no error → try next model
      } catch (err: any) {
        const msg = String(err?.message || err)
        console.warn(`  ✗ ${label} error: ${msg.slice(0, 300)}`)
        if (/429|RESOURCE_EXHAUSTED|rate/i.test(msg) && attempt < backoffs.length) {
          console.log(`  … rate limited, waiting ${backoffs[attempt] / 1000}s`)
          await new Promise(r => setTimeout(r, backoffs[attempt]))
        } else break
      }
    }
  }
  return null
}

// --- Story card composition (1080x1920, FØR on top, EFTER below) ---

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function splitCaption(text: string): string[] {
  const words = text.split(' ')
  const mid = Math.ceil(text.length / 2)
  let acc = 0
  for (let i = 0; i < words.length; i++) {
    acc += words[i].length + 1
    if (acc >= mid) return [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')].filter(Boolean)
  }
  return [text]
}

function captionSvg(width: number, text: string, fontSize: number): Buffer {
  const lines = text.length > 34 ? splitCaption(text) : [text]
  const lineHeight = fontSize * 1.45
  const padX = fontSize * 0.9
  const svgLines = lines
    .map((line, i) => {
      const y = i * lineHeight
      return `<g transform="translate(${width / 2}, ${y})">
        <rect x="-${line.length * fontSize * 0.26 + padX}" y="0" width="${line.length * fontSize * 0.52 + padX * 2}" height="${lineHeight}" fill="white"/>
        <text x="0" y="${lineHeight / 2}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="#111" text-anchor="middle" dominant-baseline="central">${escapeXml(line)}</text>
      </g>`
    })
    .join('\n')
  const height = Math.ceil(lines.length * lineHeight)
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgLines}</svg>`)
}

function labelSvg(text: string, fontSize = 34): Buffer {
  const w = text.length * (fontSize * 0.72 + 3) + Math.round(fontSize * 1.4)
  return Buffer.from(
    `<svg width="${w}" height="${fontSize + 28}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${w}" height="${fontSize + 28}" fill="white"/>
      <text x="${w / 2}" y="${(fontSize + 28) / 2}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" letter-spacing="3" fill="#111" text-anchor="middle" dominant-baseline="central">${escapeXml(text)}</text>
    </svg>`,
  )
}

/** Vertical before/after card: FØR on top, EFTER below, caption band on the seam. */
async function composeVerticalCard(
  original: Buffer | string,
  improved: Buffer | string,
  caption: string,
  W: number,
  H: number,
): Promise<Buffer> {
  const half = H / 2

  const top = await sharp(original).rotate().resize(W, half, { fit: 'cover' }).toBuffer()
  const bottom = await sharp(improved).resize(W, half, { fit: 'cover' }).toBuffer()

  const capSvg = captionSvg(W, caption, 52)
  const capMeta = await sharp(capSvg).metadata()
  const capH = capMeta.height || 80

  return sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([
      { input: top, top: 0, left: 0 },
      { input: bottom, top: half, left: 0 },
      { input: await sharp(labelSvg('FØR')).toBuffer(), top: 40, left: 40 },
      { input: await sharp(labelSvg('EFTER — AI')).toBuffer(), top: Math.round(half + capH / 2) + 36, left: 40 },
      { input: await sharp(capSvg).toBuffer(), top: Math.round(half - capH / 2), left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()
}

/** 9:16 story card (1080x1920) — Instagram/Facebook story. */
export async function composeStoryCard(original: Buffer | string, improved: Buffer | string, caption: string): Promise<Buffer> {
  return composeVerticalCard(original, improved, caption, 1080, 1920)
}

/** 4:5 feed card (1080x1350) — Instagram/Facebook feed. */
export async function composeFeedCard(original: Buffer | string, improved: Buffer | string, caption: string): Promise<Buffer> {
  return composeVerticalCard(original, improved, caption, 1080, 1350)
}

/** Landscape side-by-side (2160x1080) — listing pages and presentations. */
export async function composeSideBySide(original: Buffer | string, improved: Buffer | string): Promise<Buffer> {
  const half = 1080
  const left = await sharp(original).rotate().resize(half, half, { fit: 'cover' }).toBuffer()
  const right = await sharp(improved).resize(half, half, { fit: 'cover' }).toBuffer()
  return sharp({ create: { width: half * 2, height: half, channels: 3, background: '#000' } })
    .composite([
      { input: left, top: 0, left: 0 },
      { input: right, top: 0, left: half },
      { input: await sharp(labelSvg('FØR')).toBuffer(), top: 40, left: 40 },
      { input: await sharp(labelSvg('EFTER — AI')).toBuffer(), top: 40, left: half + 40 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()
}

/**
 * Bake an "EFTER — AI" disclosure label into the corner of the improved image.
 * AI-modified listing photos must be recognizable as such — the watermark is
 * part of the output, not an optional overlay.
 */
export async function watermarkAfter(improved: Buffer): Promise<Buffer> {
  const meta = await sharp(improved).metadata()
  const w = meta.width || 2048
  const h = meta.height || 1536
  const fontSize = Math.max(24, Math.round(w / 45))
  const label = await sharp(labelSvg('EFTER — AI', fontSize)).toBuffer()
  const labelMeta = await sharp(label).metadata()
  const margin = Math.round(w / 60)
  return sharp(improved)
    .composite([{ input: label, top: h - (labelMeta.height || 60) - margin, left: w - (labelMeta.width || 300) - margin }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
