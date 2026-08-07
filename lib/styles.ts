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

/** Build the full prompt: adaptive scene detection + structure rules + chosen style. */
export function buildStylePrompt(styleKey: string): string {
  const style = STYLES[styleKey]
  if (!style) throw new Error(`Unknown style: ${styleKey}`)
  return `Renovate the space in this photo. FIRST identify what kind of space it is (living room, kitchen, bedroom, bathroom, office, attic, hallway, house exterior, garden, courtyard, garage ...) and then apply a tasteful renovation in the style described below, appropriate for that kind of space.

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
