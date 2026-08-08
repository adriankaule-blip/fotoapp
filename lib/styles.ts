/**
 * Pure data: user-selectable STYLES for the web app.
 * The model identifies the space itself (room / exterior / garden) and applies
 * the chosen style. No imports — safe for both server and client bundles.
 */

import { STRUCTURE_BLOCK } from './scenes'

export type Style = {
  name: string
  emoji: string
  caption: string
  description: string
  block: string
}

export const STYLES: Record<string, Style> = {
  klassisk: {
    name: 'Klassisk',
    emoji: '🏛️',
    caption: 'Forvandlet i klassisk stil',
    description: 'Tidløs dansk elegance — egetræ, hvide vægge, klassiske møbler',
    block: `STYLE: CLASSIC DANISH — timeless, elegant, warm
IF INTERIOR:
- Wide-plank oak floors, warm white walls, classic panel doors kept
- Timeless quality furniture: upholstered sofas in neutral fabric, oak and walnut wood, brass details
- Classic pendant lamps and table lamps with warm light, framed art, wool rugs
IF EXTERIOR/GARDEN:
- Freshly whitewashed/lime-painted facade (klassisk hvidkalket), original roof tiles cleaned and algae-free
- Window frames freshly painted in their traditional colors, classic outdoor lanterns
- Neatly mown lawn, trimmed hedges, gravel paths weed-free, classic garden furniture`,
  },
  moderne: {
    name: 'Moderne',
    emoji: '⬛',
    caption: 'Forvandlet i moderne stil',
    description: 'Rene linjer — sort skifer, sorte vinduer, minimalistiske møbler',
    block: `STYLE: MODERN DANISH — clean, architectural, high-end contemporary
IF INTERIOR:
- Wide-plank light oak or polished concrete floors, crisp white walls
- Modern design furniture with clean lines: low-profile sofa, sculptural chairs, matte black and oak details
- Recessed/designer lighting, large-format art, minimal styling — uncluttered
IF EXTERIOR/GARDEN:
- NEW ROOF: matte black natural slate tiles (skifer), crisp ridge lines
- Modern matte black window and door frames in the SAME openings — slim profiles
- Facade smooth rendered crisp white, black zinc gutters, discreet modern wall lights
- Garden architectural and neat: mown lawn, sharp edges, trimmed hedges in clean forms`,
  },
  romantisk: {
    name: 'Romantisk',
    emoji: '🌸',
    caption: 'Forvandlet i romantisk stil',
    description: 'Blødt og indbydende — pasteller, blomster, hør og varmt lys',
    block: `STYLE: ROMANTIC — soft, charming, warm and poetic
IF INTERIOR:
- Soft palette: cream, dusty rose, sage, warm pastels on freshly painted walls
- Linen textiles, soft throws, vintage-inspired furniture with gentle curves
- Fresh flowers in vases, candles, warm golden light — cozy and inviting
IF EXTERIOR/GARDEN:
- Facade freshly painted in soft warm white/cream, roof clean and well-kept
- Climbing roses or wisteria on a facade trellis, flower beds generously blooming
- Romantic garden: lush borders, a bistro set with two chairs, string lights, mown lawn`,
  },
  minimalistisk: {
    name: 'Minimalistisk',
    emoji: '◻️',
    caption: 'Forvandlet i minimalistisk stil',
    description: 'Færrest mulige ting — lyst, luftigt og helt roligt',
    block: `STYLE: MINIMALIST — calm, airy, almost empty
IF INTERIOR:
- Light oak floor, white walls, NOTHING unnecessary — every object earns its place
- Very few furniture pieces: one great sofa OR bed OR table, one lamp, one plant
- Hidden storage, no decor clutter, soft natural daylight as the main feature
IF EXTERIOR/GARDEN:
- Facade in one clean uniform light color, roof spotless
- Garden reduced to lawn, one sculptural tree/hedge, clean gravel surfaces — zen calm`,
  },
  landlig: {
    name: 'Landlig',
    emoji: '🌾',
    caption: 'Forvandlet i landlig stil',
    description: 'Landhygge — naturtræ, uld, bindingsværk og bondehavecharme',
    block: `STYLE: COUNTRY / FARMHOUSE — rustic Danish landhygge
IF INTERIOR:
- Warm plank floors, visible wood beams celebrated, whitewashed walls
- Solid wood farmhouse furniture, wool and sheepskin textiles, ceramics and woven baskets
- Wood-burning stove glowing if present, warm cozy light
IF EXTERIOR/GARDEN:
- Facade traditionally maintained (whitewash or warm tone), thatched/tile roof clean and tidy
- Half-timbering and barn doors freshly painted in traditional colors
- Cottage garden: apple trees, berry bushes, flower beds, neat vegetable patch, mown lawn`,
  },
  luksus: {
    name: 'Luksus',
    emoji: '✨',
    caption: 'Forvandlet i luksusstil',
    description: 'Eksklusivt — marmor, designermøbler og hotelfornemmelse',
    block: `STYLE: LUXURY — exclusive, five-star hotel feeling
IF INTERIOR:
- Premium materials: marble, brushed brass, dark oak, bouclé and velvet textiles
- Iconic designer furniture, statement chandelier/pendant, large art pieces
- Perfectly styled: coffee table books, orchids, ambient layered lighting
IF EXTERIOR/GARDEN:
- Immaculate facade with premium finish, perfect roof, designer outdoor lighting
- Landscaped garden: manicured lawn, sculpted hedges, natural stone terrace with lounge furniture`,
  },
}

// --- Modes: what KIND of transformation the user wants ---

export type ModeDef = {
  name: string
  emoji: string
  description: string
  usesStyle: boolean
  caption?: string
}

export const MODES: Record<string, ModeDef> = {
  renovering: {
    name: 'Renovering',
    emoji: '🛠️',
    description: 'Fuld renovering — nye gulve, møbler og overflader i den valgte stil',
    usesStyle: true,
  },
  staging: {
    name: 'Møblering',
    emoji: '🛋️',
    description: 'Tomme rum møbleres i den valgte stil — vægge, gulve og overflader røres ikke',
    usesStyle: true,
  },
  oprydning: {
    name: 'Oprydning',
    emoji: '🧹',
    description: 'Samme bolig, samme møbler — bare ryddet op, rengjort og klar til fotos',
    usesStyle: false,
    caption: 'Klar til fremvisning',
  },
}

/** Default caption for a mode/style combination. */
export function captionFor(modeKey: string, styleKey: string): string {
  const mode = MODES[modeKey]
  if (mode && !mode.usesStyle && mode.caption) return mode.caption
  const style = STYLES[styleKey]
  if (!style) return 'Forvandlet med AI'
  if (modeKey === 'staging') return style.caption.replace('Forvandlet', 'Møbleret')
  return style.caption
}

// Camera/architecture preservation + photorealism, shared by the non-renovation
// modes (STRUCTURE_BLOCK itself mandates full furniture replacement, which only
// applies to renovering).
const PRESERVE_BLOCK = `CRITICAL — READ THIS FIRST:
This task operates on the EXACT SAME room/space shown in the input photo. The output will be shown DIRECTLY BELOW the input photo in a before/after comparison — any change to the architecture or camera will be caught immediately.

ARCHITECTURE & CAMERA — COPY EXACTLY, CHANGE NOTHING:
- SAME camera position, same lens, same angle, same framing, same perspective lines
- SAME room geometry: wall positions, ceiling height and slope, floor plan
- SAME windows and doors: exact positions, sizes, frame styles, and what is visible THROUGH them
- SAME daylight direction and time of day as the input

PHOTOREALISM — ANTI-AI MANDATE:
- Must look like a REAL photograph from a professional Danish real-estate listing (EDC/Home style)
- Natural light, believable shadows, true-to-life materials — no HDR glow, no plastic surfaces
- Slight photographic imperfection is GOOD; too perfect looks fake
- No people, no text, no watermarks, no graphics in the image`

const FUNCTION_LOCK_BLOCK = `FUNCTION LOCK — THE ROOM KEEPS ITS PURPOSE:
- The room must serve the SAME FUNCTION as in the input photo — a dressing room stays a dressing room, a kitchen stays a kitchen, a hallway stays a hallway
- NEVER convert the room into a different room type
- Only add furniture that belongs to the room's existing function: a bed ONLY in a clear bedroom, a sofa ONLY in living spaces, wardrobes/shelving in dressing rooms, etc.
- BATHROOMS keep their sanitary fixtures in the exact same positions; KITCHENS keep their kitchen function and cabinet layout
- Hallways/entries get wardrobe hooks, a bench, a mirror — never living room or bedroom furniture`

function buildStagingPrompt(styleKey: string): string {
  const style = STYLES[styleKey]
  if (!style) throw new Error(`Unknown style: ${styleKey}`)
  return `Virtually STAGE the space in this photo for a real-estate listing. FIRST identify what kind of space it is (living room, kitchen, bedroom, bathroom, dressing room, home office, hallway, attic, exterior, garden ...), then furnish it in the style described below.

THIS IS STAGING, NOT RENOVATION — THE BUILDING IS UNTOUCHED:
- Walls, wall colors, floors, ceilings, doors, windows, kitchen cabinets, bathroom fixtures, radiators, stoves: keep EXACTLY as they appear in the input — same materials, same colors, same wear
- Do NOT repaint, do NOT replace floors, do NOT change any fixed installation
- If the space is empty or nearly empty: furnish it convincingly for its function
- If it holds a few loose furniture pieces: you may replace those loose pieces with a coherent staged set — nothing else changes
- For exteriors/gardens: only add tasteful outdoor furniture and tidy styling — the building, planting and hard surfaces stay exactly as they are

${FUNCTION_LOCK_BLOCK}

${PRESERVE_BLOCK}

FURNISH IN THIS STYLE (pick only pieces matching the room's function):
${style.block}

REMEMBER: a viewer must recognize every surface from the input photo — only the furniture and styling are new.`
}

function buildOprydningPrompt(): string {
  return `Make the space in this photo PRESENTATION-READY for real-estate photography — a professional declutter and clean, nothing more.

THIS IS TIDYING, NOT RENOVATION OR RESTYLING:
- ALL furniture stays: same pieces, same positions. All surfaces, wall colors, floors, curtains and fixed installations stay exactly as they are
- REMOVE clutter: piles of paper, loose cables, laundry, dishes, open boxes, bags, toys, overloaded shelves, fridge magnets, crowded countertops, personal photos and toiletries
- STRAIGHTEN: cushions plumped, throws folded, bedding made neatly, chairs pushed in, curtains hanging properly
- CLEAN: surfaces wiped, floors clean, windows clear, no smudges or stains
- You may add AT MOST one or two neutral touches (a folded throw, a simple plant) — nothing else new
- For exteriors/gardens: bins, hoses, toys and clutter removed, lawn freshly mown, paths swept — planting and building untouched

${PRESERVE_BLOCK}

REMEMBER: same home, same furniture, same style — it just looks like the owners tidied up perfectly before the photographer arrived.`
}

/** Build the full prompt for a mode/style combination. */
export function buildPrompt(modeKey: string, styleKey: string): string {
  if (modeKey === 'staging') return buildStagingPrompt(styleKey)
  if (modeKey === 'oprydning') return buildOprydningPrompt()
  return buildStylePrompt(styleKey)
}

export function modeList(): { key: string; name: string; emoji: string; description: string; usesStyle: boolean }[] {
  return Object.entries(MODES).map(([key, m]) => ({ key, name: m.name, emoji: m.emoji, description: m.description, usesStyle: m.usesStyle }))
}

/** Build the full prompt: adaptive scene detection + structure rules + chosen style. */
export function buildStylePrompt(styleKey: string): string {
  const style = STYLES[styleKey]
  if (!style) throw new Error(`Unknown style: ${styleKey}`)
  return `Renovate the space in this photo. FIRST identify what kind of space it is (living room, kitchen, bedroom, bathroom, walk-in closet / dressing room, home office, hallway/entry, laundry/utility room, attic, staircase, house exterior, garden, courtyard, garage ...) and then apply a tasteful renovation in the style described below, appropriate for that kind of space.

FUNCTION LOCK — THE ROOM KEEPS ITS PURPOSE:
- The renovated room must serve the SAME FUNCTION as in the input photo — a dressing room stays a dressing room, a kitchen stays a kitchen, a hallway stays a hallway
- NEVER convert the room into a different room type
- Only add furniture that belongs to the room's existing function: a bed ONLY if the input clearly shows a bedroom, a sofa ONLY in living spaces, wardrobes/shelving in dressing rooms, etc.
- If clothes storage dominates the input (racks, wardrobes, shoes), it is a DRESSING ROOM: style it with beautiful built-in wardrobes, open shelving, a full-length mirror, an island or bench — NOT a bed
- BATHROOMS keep their sanitary fixtures (tub, shower, toilet, sink) in the exact same positions — refresh surfaces and styling only
- KITCHENS keep their kitchen function and cabinet layout — refresh fronts, countertop and styling; never remove the kitchen
- Hallways/entries get wardrobe hooks, a bench, a mirror — never living room or bedroom furniture
- The furniture examples in the style description below are inspiration for the STYLE — pick only the ones matching this room's function

${STRUCTURE_BLOCK}

${style.block}

REMEMBER:
- ONLY fixed installations stay (beams, ceilings, stoves, radiators, windows, doors, walls — and for exteriors: the building's exact shape and openings)
- ALL loose furniture, clutter and textiles from the input are removed and replaced in the chosen style
- Floors upgraded for interiors; lawns/gravel refreshed for exteriors
- The result must read instantly as THE SAME space, beautifully renovated in the chosen style`
}

export function styleList(): { key: string; name: string; emoji: string; caption: string; description: string }[] {
  return Object.entries(STYLES).map(([key, s]) => ({ key, name: s.name, emoji: s.emoji, caption: s.caption, description: s.description }))
}
