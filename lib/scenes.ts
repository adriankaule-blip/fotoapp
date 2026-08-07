/**
 * Pure data: the structure-preservation block and all scene prompts.
 * No imports — safe to reference from both server (engine) and client (scene picker).
 */

export const STRUCTURE_BLOCK = `CRITICAL — READ THIS FIRST:
This is a RENOVATION VISUALIZATION task on the EXACT SAME room/space shown in the input photo. You are showing what this specific space could look like after a tasteful renovation. The output will be shown DIRECTLY BELOW the input photo in a before/after comparison — any change to the architecture or camera will be caught immediately.

ARCHITECTURE & CAMERA — COPY EXACTLY, CHANGE NOTHING:
- SAME camera position, same lens, same angle, same framing, same perspective lines
- SAME room geometry: wall positions, ceiling height and slope, floor plan
- SAME windows and doors: exact positions, sizes, frame styles, and what is visible THROUGH them
- Keep structural character features exactly: exposed beams, wood ceilings, radiators, wood-burning stoves, columns
- SAME daylight direction and time of day as the input
- A viewer must instantly recognize: "this is the same room, just renovated"

WHAT TO IMPROVE (the renovation):
- ONLY fixed installations stay: beams, ceilings, stoves, radiators, windows, doors, walls
- ALL loose furniture, freestanding storage, clutter and textiles from the input are REMOVED and replaced per the scene instructions
- Floors are upgraded unless the scene says otherwise
- Furniture, rugs/carpets, textiles, lighting fixtures, wall paint, decor, styling, tidiness
- The room KEEPS ITS FUNCTION — never convert it into a different room type, unless the scene instructions explicitly say so
- Scene-specific instructions below define the exact scope

PHOTOREALISM — ANTI-AI MANDATE:
- Must look like a REAL photograph from a professional Danish real-estate listing (EDC/Home style)
- Natural light, believable shadows, true-to-life materials — no HDR glow, no plastic surfaces
- Slight photographic imperfection is GOOD; too perfect looks fake
- No people, no text, no watermarks, no graphics in the image

STYLE DIRECTION:
- Danish/Scandinavian interior style: light, warm, minimal but lived-in
- Quality materials: oak, wool, linen, ceramic — neutral and earth tones
- Think: a stylist staged this home for sale — aspirational but realistic and affordable`

export type Scene = {
  name: string
  caption: string
  description: string
  prompt: string
}

export const SCENES: Record<string, Scene> = {
  'living-room': {
    name: 'Stue',
    caption: 'Nyt trægulv, ny sofa og friskmalede vægge',
    description: 'Nyt egetræsgulv, moderne skandinaviske møbler, alt løst udskiftes',
    prompt: `Renovate this living room. ONLY fixed installations stay — ALL loose furniture and freestanding storage is replaced.

${STRUCTURE_BLOCK}

KEEP ONLY FIXED INSTALLATIONS:
- The ceiling and any exposed beams EXACTLY as they are — character features
- Any wood-burning stove and its hearth plate, exactly where they are
- Windows, doors, walls in their exact positions — and the exact view through the windows

REMOVE COMPLETELY (do not keep ANY freestanding furniture from the input):
- All bookcases, shelving units, cabinets, sideboards and freestanding storage — walls behind them freshly painted and empty or with one piece of minimal art
- All old sofas, armchairs, recliners, footstools, tables and textiles

THE RENOVATION:
- NEW FLOOR: wide-plank light oak wood flooring laid throughout the entire room — this replaces the old floor completely
- Freshly painted walls in warm white — smooth, clean finish
- New modern Scandinavian furniture: a light oatmeal-colored fabric sofa, an oak coffee table, a comfortable lounge chair
- A large soft wool rug in warm neutral tones under the seating area, on top of the new wood floor
- Tasteful decor: floor lamp with soft warm light, a few cushions and a throw, a plant
- Tidy everything — no clutter, no loose cables
- Warm, inviting daylight through the existing windows`,
  },
  kitchen: {
    name: 'Køkken',
    caption: 'Opgraderet køkken med nye fronter',
    description: 'Nye fronter og bordplade, samme layout',
    prompt: `Renovate this kitchen while keeping the room itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Keep the layout of cabinets and island exactly — refresh fronts in a modern matte finish
- New countertop in oak or light stone
- Freshly painted walls, tidy open shelving with matching ceramics
- Modern pendant lights over the island, keep ceiling beams exactly
- Clean, styled surfaces: a bowl of fruit, a cutting board, fresh herbs — nothing more`,
  },
  bedroom: {
    name: 'Soveværelse',
    caption: 'Nyt soveværelse med varme toner',
    description: 'Kvalitetsseng, varme toner, roligt udtryk',
    prompt: `Renovate this bedroom while keeping the room itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Freshly painted walls in a calm warm tone
- A quality bed with linen bedding, styled but naturally rumpled
- Bedside tables with warm lamps, a soft rug under the bed
- Light curtains on the existing windows, everything tidy`,
  },
  office: {
    name: 'Kontor',
    caption: 'Fra rod til roligt hjemmekontor',
    description: 'Ryddet og organiseret hjemmekontor',
    prompt: `Renovate this room into a calm, organized home office while keeping the room itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Freshly painted walls, a quality oak desk with a tidy setup
- An ergonomic but elegant chair, a soft rug, warm desk lamp
- Organized shelving — no clutter, no cables, no hanging laundry, no shoes, no leaning mirrors`,
  },
  bathroom: {
    name: 'Badeværelse',
    caption: 'Badeværelset med spa-fornemmelse',
    description: 'Rent, lyst og spa-agtigt — faste installationer bevares',
    prompt: `Refresh this bathroom while keeping the room itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Keep tiles, tub, shower and window exactly where they are — refresh grout and surfaces so everything looks clean and new
- Fresh white towels, a small plant, minimal quality accessories
- Everything spotless and bright`,
  },
  attic: {
    name: 'Loftrum',
    caption: 'Loftet — fra opbevaring til hyggerum',
    description: 'Ryddet loftrum med hyggekrog',
    prompt: `Transform this attic space into a cozy usable room while keeping the space itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Keep the sloped ceiling and structure exactly
- Remove all boxes and clutter completely
- A cozy lounge corner: daybed with cushions, soft rug, warm floor lamp
- Clean floor, warm inviting light`,
  },
  garden: {
    name: 'Have',
    caption: 'Haven — nyklippet og indbydende',
    description: 'Slået græs, klippede hække, ryddet have',
    prompt: `Tidy up this garden while keeping the landscape itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION (garden edition):
- SAME trees, same hedges in the same positions, same horizon and view
- Freshly mown, healthy green lawn — even and cared for
- Hedges and bushes neatly trimmed, beds weeded and edged
- Remove any junk, bare soil patches or mess
- Optionally a tasteful touch: a simple bench or two flower beds with modest planting
- Fresh summer day, natural Danish light`,
  },
  exterior: {
    name: 'Facade (generel)',
    caption: 'Huset — nyt tag og velholdt have',
    description: 'Velholdt facade og have, samme farver',
    prompt: `Renovate this house exterior while keeping the property itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION (exterior edition):
- SAME house shape, same windows/doors in same positions, same surrounding trees and roads
- Freshly painted facade in the same color family, well-maintained roof
- Any bare dirt/messy areas become a freshly mown lawn with a neat gravel driveway
- Trimmed hedges, tidy edges — a well-kept Danish countryside property
- Same drone/photo angle, same light`,
  },
  ude: {
    name: 'Facade — hvidkalket',
    caption: 'Hvidmalet hus, rent tag og velplejet have',
    description: 'Hvid facade, algefrit tag, pæn have — klassisk look',
    prompt: `Renovate this Danish countryside house exterior. The property itself stays exactly the same — this is a facade renovation and garden cleanup.

${STRUCTURE_BLOCK}

KEEP EXACTLY (fixed structure):
- Same house shape, rooflines, chimneys, window and door positions and sizes
- Same outbuildings/barns in the same positions, same driveway layout
- Same trees, same hedges in the same positions, same horizon and sky mood
- Same camera angle and distance

THE RENOVATION (exterior edition):
- ALL plastered/painted wall surfaces freshly painted CRISP WHITE (klassisk hvidkalket dansk landhus) — any yellow color is completely gone
- Black timber cladding and gables stay black but look freshly maintained; red doors and red window frames stay red, freshly painted
- ROOF: completely clean and algae-free — no moss, no black streaks, tiles look well-maintained in their original color
- LAWN: freshly mown, healthy and green — even and cared for
- Gravel/cobblestone areas clean and weed-free, neat edges between lawn and gravel
- Hedges and bushes neatly trimmed, beds weeded
- Remove any junk, clutter, garden mess; garden furniture (if any) tidy and attractive
- Fresh Danish summer day, natural light, same weather mood as input`,
  },
  'ude-moderne': {
    name: 'Facade — moderniseret',
    caption: 'Sort skifertag og moderne vinduer',
    description: 'Sort skifertag, sorte vinduer, hvid puds — moderne look',
    prompt: `Modernize this Danish countryside house exterior with UPGRADES ONLY — no structural changes. The building keeps its exact shape; only surfaces, roof, windows and doors are upgraded to a modern standard.

${STRUCTURE_BLOCK}

KEEP EXACTLY (no structural changes):
- Same house shape, same rooflines and roof pitch, same chimneys
- Windows and doors in the EXACT same positions and sizes — only the frames/materials change
- Same outbuildings/barns in the same positions, same driveway layout
- Same trees, hedges, horizon and camera angle

THE MODERNIZATION (easy, realistic upgrades):
- NEW ROOF: modern BLACK natural slate tiles (skifer) — flat, crisp, matte black, neatly laid with clean ridge lines
- NEW WINDOWS: modern matte BLACK aluminium/wood window frames in the same openings — slim profiles, clean glazing, contemporary Danish style
- Doors upgraded to modern matte black or warm wood designs in the same openings
- Facade freshly rendered and painted crisp WHITE — smooth modern finish
- New black zinc gutters and downspouts, discreet modern outdoor wall lights by the doors
- Black timber cladding/gables stay black but look freshly renovated with clean modern boards
- Garden neat: freshly mown lawn, trimmed hedges, clean weed-free gravel/cobblestones, no junk
- The result: a tastefully modernized countryside house — "nybygget fornemmelse" — but clearly the SAME building
- Fresh Danish summer day, natural light, same weather mood as input`,
  },
  'dining-room': {
    name: 'Spisestue',
    caption: 'Ny spisestue med egetræsgulv',
    description: 'Egetræsgulv, langbord og designstole',
    prompt: `Renovate this dining room. ONLY fixed installations stay — ALL loose furniture is replaced.

${STRUCTURE_BLOCK}

KEEP ONLY FIXED INSTALLATIONS:
- The ceiling exactly as it is
- The window/glass wall sections and the exact view through them
- Walls, doors and openings in their exact positions

REMOVE COMPLETELY:
- The old dining table, tablecloths and mixed chairs
- All speakers, electronics, artwork and freestanding storage

THE RENOVATION:
- NEW FLOOR: wide-plank light oak wood flooring throughout — replaces the old floor completely
- Freshly painted warm white walls
- A long solid oak dining table with 6 modern Danish design chairs
- A sculptural designer pendant lamp above the table
- Minimal styling: a ceramic vase with fresh branches, a large soft-toned artwork on one wall
- Warm natural daylight from the windows`,
  },
  sunroom: {
    name: 'Havestue',
    caption: 'Havestuen — lys og indbydende',
    description: 'Lys havestue med loungestole og planter',
    prompt: `Renovate this garden room / sunroom. ONLY fixed installations stay.

${STRUCTURE_BLOCK}

KEEP ONLY FIXED INSTALLATIONS:
- The glass walls with their frames and the exact garden view through them
- The ceiling and door openings exactly as they are

REMOVE COMPLETELY:
- All loose items, shelving and clutter

THE RENOVATION:
- NEW FLOOR: large light natural stone tiles, clean and level — replacing the worn floor
- Freshly painted white walls
- A cozy reading corner: two comfortable lounge chairs in natural rattan/fabric with a small side table
- Several beautiful green plants in large ceramic pots — bring the garden feeling inside
- A soft outdoor-style rug, warm afternoon light through the glass`,
  },
  oppe: {
    name: 'Loft til kip (førstesal)',
    caption: 'Førstesalen — ny stue med loft til kip',
    description: 'Råt loft bygges færdigt som stue med loft til kip',
    prompt: `Convert this raw, unfinished attic into a beautiful FINISHED first-floor living room with full vaulted ceilings (danish: "loft til kip"). This is a complete build-out — but the roof geometry must stay recognizable.

${STRUCTURE_BLOCK}

KEEP THE GEOMETRY:
- Same roof pitch and A-frame shape, same room length and width, same camera angle
- Same gable window position (freshly renovated with new glazing)
- A few of the original timber beams/collar ties remain VISIBLE as sanded, warm-wood character features

THE BUILD-OUT (everything else is new):
- Fully finished insulated sloped ceilings clad in white-painted wood paneling, following the roofline all the way to the ridge — bright and airy
- Two discreet skylights letting daylight flood in
- NEW FLOOR: wide-plank light oak wood flooring throughout
- Low white knee walls with a built-in low bookshelf along one side
- A cozy Scandinavian lounge: comfortable light fabric sofa with cushions and a throw, oak coffee table, soft wool rug
- Warm lighting: floor lamp and small wall sconces on the beams
- A plant, a few books, hygge styling — clean and uncluttered
- ALL construction mess, boxes, insulation, pipes and clutter are GONE
- Looks like a finished, professionally renovated first-floor living room from a Danish real-estate listing`,
  },
  garage: {
    name: 'Garage / værksted',
    caption: 'Værkstedet — ryddet og organiseret',
    description: 'Ryddet og organiseret værksted',
    prompt: `Tidy and renovate this garage/workshop while keeping the space itself untouched.

${STRUCTURE_BLOCK}

THE RENOVATION:
- Keep walls, gates and structure exactly — freshly whitewashed walls
- All clutter organized: neat shelving units, tools on a wall board
- Clean sealed floor, good even lighting`,
  },
}

/** Lightweight list for UI pickers — no prompts included in the payload the client actually renders. */
export function sceneList(): { key: string; name: string; caption: string; description: string }[] {
  return Object.entries(SCENES).map(([key, s]) => ({ key, name: s.name, caption: s.caption, description: s.description }))
}
