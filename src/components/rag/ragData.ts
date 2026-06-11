import type { DocumentChunk } from '../../types'

// ── Keyword-based text embedding (16 semantic dimensions) ─────────────────
// Each dimension corresponds to a concept cluster. The embedding for any
// text is computed by counting keyword hits per cluster, giving a vector
// that lives in a consistent semantic space regardless of the input source.

export const DIMENSIONS: { label: string; keywords: string[] }[] = [
  { label: 'pasta',       keywords: ['pasta', 'spaghetti', 'carbonara', 'fettuccine', 'penne', 'noodle', 'al dente', 'rigatoni', 'linguine', 'tagliatelle'] },
  { label: 'baking',      keywords: ['bak', 'flour', 'yeast', 'dough', 'knead', 'proof', 'rise', 'oven', 'loaf', 'pastry', 'cookie', 'cake'] },
  { label: 'grilling',    keywords: ['grill', 'bbq', 'barbecue', 'sear', 'smoke', 'char', 'charcoal', 'skewer', 'flare', 'ember'] },
  { label: 'sauce',       keywords: ['sauce', 'tomato', 'simmer', 'reduce', 'broth', 'gravy', 'ragu', 'marinara', 'béchamel', 'pesto'] },
  { label: 'spice',       keywords: ['spice', 'cumin', 'paprika', 'pepper', 'turmeric', 'herb', 'season', 'salt', 'coriander', 'chilli', 'blend'] },
  { label: 'dairy',       keywords: ['butter', 'cream', 'cheese', 'milk', 'egg', 'parmesan', 'mozzarella', 'yogurt', 'ricotta', 'pecorino'] },
  { label: 'vegetable',   keywords: ['vegetable', 'mushroom', 'zucchini', 'onion', 'garlic', 'spinach', 'lentil', 'carrot', 'celery', 'pepper', 'aubergine'] },
  { label: 'technique',   keywords: ['knife', 'chop', 'dice', 'mince', 'julienne', 'slice', 'deglaze', 'braise', 'blanch', 'fold', 'whisk'] },
  { label: 'bread',       keywords: ['bread', 'sourdough', 'starter', 'gluten', 'crumb', 'crust', 'ferment', 'levain', 'hydration', 'windowpane'] },
  { label: 'dessert',     keywords: ['sugar', 'chocolate', 'sweet', 'vanilla', 'caramel', 'tart', 'mousse', 'ganache', 'frosting', 'brownie'] },
  { label: 'protein',     keywords: ['meat', 'chicken', 'beef', 'fish', 'tofu', 'marinade', 'rest', 'steak', 'pork', 'lamb', 'shrimp'] },
  { label: 'acid',        keywords: ['lemon', 'vinegar', 'vinaigrette', 'citrus', 'lime', 'acidity', 'pickle', 'ferment', 'balance', 'bright'] },
  { label: 'fat',         keywords: ['oil', 'olive', 'emulsify', 'render', 'fat', 'drizzle', 'fry', 'sauté', 'grease', 'lard'] },
  { label: 'temperature', keywords: ['heat', 'sear', 'roast', 'caramelise', 'caramelize', 'maillard', 'brown', 'temp', 'thermometer', 'medium-rare'] },
  { label: 'vegetarian',  keywords: ['vegetarian', 'vegan', 'plant-based', 'substitute', 'umami', 'lentil', 'chickpea', 'legume', 'nut', 'tofu'] },
  { label: 'storage',     keywords: ['refrigerat', 'freeze', 'preserv', 'store', 'shelf', 'wrap', 'airtight', 'pantry', 'leftover', 'reheat'] },
]

export const DIM_LABELS = DIMENSIONS.map(d => d.label)

export function textEmbed(text: string): number[] {
  const lower = text.toLowerCase()
  const raw = DIMENSIONS.map(({ keywords }) => {
    let score = 0
    for (const kw of keywords) {
      // Count all occurrences; longer matches score slightly higher
      let pos = 0
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        score += 1 + kw.length * 0.05
        pos += kw.length
      }
    }
    return score
  })

  // Add a small noise floor so zero-vectors don't collapse to origin
  const noisy = raw.map((v, i) => v + 0.08 * Math.sin(i * 2.4 + text.length * 0.1))

  const norm = Math.sqrt(noisy.reduce((s, x) => s + x * x, 0))
  return norm === 0 ? noisy.map(() => 0) : noisy.map(x => x / norm)
}

export const RAG_DOCUMENTS: DocumentChunk[] = [
  {
    id: 'doc-1',
    title: 'Pasta Carbonara',
    body: 'Authentic carbonara uses guanciale (cured pork cheek), eggs, Pecorino Romano, and black pepper — no cream. Cook the pasta until al dente, reserve a cup of starchy pasta water, then toss off the heat with the egg and cheese mixture, using pasta water to loosen the sauce. The heat from the pasta cooks the eggs gently into a silky coating without scrambling.',
    embedding: textEmbed('Authentic carbonara uses guanciale cured pork cheek eggs Pecorino Romano and black pepper no cream. Cook pasta until al dente reserve starchy pasta water toss with egg and cheese mixture.'),
  },
  {
    id: 'doc-2',
    title: 'Pizza Dough',
    body: 'Good pizza dough needs strong flour (high protein), water, yeast, salt, and a long cold ferment. Mix until shaggy, then knead until the gluten is smooth and elastic — aim for the windowpane test. Let it rise at room temperature for 1–2 hours, then refrigerate overnight. Cold fermentation develops flavour and makes the dough easier to stretch without tearing.',
    embedding: textEmbed('Pizza dough needs strong flour high protein water yeast salt long cold ferment. Knead until gluten smooth elastic windowpane test. Cold fermentation develops flavour easier to stretch.'),
  },
  {
    id: 'doc-3',
    title: 'Chocolate Chip Cookies',
    body: 'For chewy cookies, use more brown sugar than white — the molasses keeps them moist. Melted butter (instead of creamed) produces a denser, fudgier texture. Chill the dough for at least an hour before baking; this slows spread and deepens flavour. Pull them out of the oven when the edges are set but the centres still look underdone — they firm up as they cool.',
    embedding: textEmbed('Chewy cookies more brown sugar molasses melted butter denser fudgier texture. Chill dough before baking slow spread deepen flavour. Pull out oven edges set centres underdone firm up cool.'),
  },
  {
    id: 'doc-4',
    title: 'Knife Skills',
    body: 'A sharp knife is safer than a dull one — it requires less force and slips less. For a standard dice: square off the vegetable, cut planks, then batons, then cubes. Curl your fingertips into a "claw" grip so the knuckle guides the blade. For herbs, use a rocking chop: anchor the tip, rock the blade through the leaves repeatedly without lifting the tip. A honing steel straightens the edge between sharpenings.',
    embedding: textEmbed('Sharp knife safer less force. Dice square off vegetable cut planks batons cubes. Claw grip knuckle guides blade. Rocking chop anchor tip rock blade herbs. Honing steel straightens edge.'),
  },
  {
    id: 'doc-5',
    title: 'Tomato Sauce Basics',
    body: 'Start with olive oil and softened garlic, add crushed tomatoes, then simmer uncovered to let the sauce reduce and concentrate. Season with salt, a pinch of sugar if the tomatoes are acidic, and fresh basil at the end. For a smoother sauce, use a hand blender. For a chunky ragu, add browned mince and cook low and slow for 2+ hours. Good tomato sauce is about patience and balance.',
    embedding: textEmbed('Olive oil softened garlic crushed tomatoes simmer reduce concentrate. Season salt sugar tomatoes acidic fresh basil. Smooth sauce hand blender chunky ragu browned mince cook low slow hours.'),
  },
  {
    id: 'doc-6',
    title: 'Sourdough Bread',
    body: 'Sourdough relies on a live starter — a fermented mix of flour and water that captures wild yeast and bacteria. Feed it daily: discard half, add equal weights of flour and water. When it doubles in 4–6 hours and passes the float test, it\'s ready. Mix with flour, water, and salt. Stretch and fold every 30 minutes for 3 hours (bulk fermentation). Shape, proof in a floured banneton overnight, then bake in a preheated Dutch oven for an open, airy crumb.',
    embedding: textEmbed('Sourdough starter fermented flour water wild yeast bacteria. Feed discard double float test ready. Stretch fold bulk fermentation. Shape proof banneton bake Dutch oven crumb crust.'),
  },
  {
    id: 'doc-7',
    title: 'Vinaigrette & Dressings',
    body: 'A classic vinaigrette is 3 parts oil to 1 part acid (vinegar or lemon juice), emulsified with a touch of mustard and seasoned with salt and pepper. Whisk the acid, mustard, and salt first, then drizzle in oil while whisking to form a stable emulsion. Add honey for sweetness, garlic for depth, or fresh herbs. Taste and balance: it should be bright and punchy, not flat. Store in a jar — shake to re-emulsify before each use.',
    embedding: textEmbed('Vinaigrette oil acid vinegar lemon juice emulsify mustard salt pepper. Whisk acid mustard drizzle oil emulsion. Honey garlic herbs balance bright punchy. Shake re-emulsify before use.'),
  },
  {
    id: 'doc-8',
    title: 'Grilling Techniques',
    body: 'For a perfect sear, preheat the grill until very hot and pat the protein dry — moisture is the enemy of browning. Oil the food, not the grate. Use direct heat for thin cuts and quick-cooking vegetables; indirect heat for thick cuts that need time to cook through without burning outside. Rest meat after grilling: 5 minutes for steaks, 10–15 for larger cuts. Resting lets the juices redistribute so the meat stays moist when cut.',
    embedding: textEmbed('Perfect sear preheat grill very hot pat protein dry. Oil food not grate. Direct heat thin cuts vegetables indirect heat thick cuts. Rest meat after grilling 5 minutes steaks juices redistribute moist.'),
  },
  {
    id: 'doc-9',
    title: 'Vegetarian Substitutions',
    body: 'Replacing meat in savoury dishes is mainly about replicating texture, protein, and umami. Firm tofu absorbs marinades and grills well. Lentils and chickpeas add body and protein to stews. Mushrooms — especially porcini and shiitake — provide deep, meaty umami. Walnuts lend a crumbly texture in bolognese. Smoked paprika and soy sauce can replicate the smoky depth of cured meats. Layer these substitutes thoughtfully rather than swapping one-for-one.',
    embedding: textEmbed('Vegetarian substitute meat texture protein umami. Tofu marinade grill lentil chickpea stew mushroom porcini shiitake umami. Walnuts bolognese smoked paprika soy sauce smoky cured plant-based.'),
  },
  {
    id: 'doc-10',
    title: 'Spice Blends & Seasoning',
    body: 'Layering spices at different stages builds depth. Toast whole spices in a dry pan to release volatile oils before grinding. Bloom ground spices in hot oil or butter for 30–60 seconds before adding liquid. Classic blends: garam masala (coriander, cumin, cardamom, clove, pepper), herbes de Provence (thyme, rosemary, savory, lavender), za\'atar (thyme, sumac, sesame). Salt at every stage, not just at the end — it penetrates and draws out flavour as it cooks.',
    embedding: textEmbed('Layer spices toast whole spices dry pan volatile oils grinding bloom ground spices hot oil butter. Garam masala coriander cumin cardamom pepper herbes de Provence thyme rosemary za\'atar sumac sesame salt.'),
  },
]

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}

// kept for backward compat — now backed by textEmbed
export function queryEmbedding(_seed: number): number[] {
  return textEmbed('What ingredients do I need to make pasta carbonara? guanciale eggs pecorino')
}

// ── PCA ───────────────────────────────────────────────────────────────────

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  return n === 0 ? v : v.map(x => x / n)
}

function covMulVec(centered: number[][], v: number[]): number[] {
  const Xv = centered.map(row => row.reduce((s, x, i) => s + x * v[i], 0))
  const dim = v.length
  return Array.from({ length: dim }, (_, d) =>
    centered.reduce((s, row, r) => s + row[d] * Xv[r], 0)
  )
}

function deflate(v: number[], basis: number[][]): number[] {
  let u = [...v]
  for (const b of basis) {
    const dot = u.reduce((s, x, i) => s + x * b[i], 0)
    u = u.map((x, i) => x - dot * b[i])
  }
  return normalize(u)
}

export interface PCAModel {
  mean: number[]
  pc1: number[]
  pc2: number[]
}

/** Fit PCA on a fixed set of vectors (the document corpus). */
export function pcaFit(vectors: number[][]): PCAModel {
  const n = vectors.length
  const dim = vectors[0].length
  const mean = Array.from({ length: dim }, (_, d) =>
    vectors.reduce((s, v) => s + v[d], 0) / n
  )
  const X = vectors.map(v => v.map((x, d) => x - mean[d]))

  let pc1 = normalize(Array.from({ length: dim }, (_, i) => i === 0 ? 1 : 0.1))
  for (let i = 0; i < 80; i++) pc1 = normalize(covMulVec(X, pc1))

  let pc2 = deflate(Array.from({ length: dim }, (_, i) => i === 1 ? 1 : 0.1), [pc1])
  for (let i = 0; i < 80; i++) pc2 = deflate(covMulVec(X, pc2), [pc1])

  return { mean, pc1, pc2 }
}

/** Project any vector (including user text) using a pre-fitted PCA model. */
export function pcaProject(v: number[], model: PCAModel): [number, number] {
  const centered = v.map((x, d) => x - model.mean[d])
  return [
    centered.reduce((s, x, i) => s + x * model.pc1[i], 0),
    centered.reduce((s, x, i) => s + x * model.pc2[i], 0),
  ]
}

export function pca2d(vectors: number[][]): [number, number][] {
  const model = pcaFit(vectors)
  return vectors.map(v => pcaProject(v, model))
}

/** Return spans of text that match any keyword dimension, for highlight rendering. */
export function getHighlights(text: string): { start: number; end: number; dimIndex: number }[] {
  const lower = text.toLowerCase()
  const spans: { start: number; end: number; dimIndex: number }[] = []

  DIMENSIONS.forEach(({ keywords }, dimIndex) => {
    for (const kw of keywords) {
      let pos = 0
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        spans.push({ start: pos, end: pos + kw.length, dimIndex })
        pos += kw.length
      }
    }
  })

  // Sort by start position; drop spans fully contained in an earlier span
  spans.sort((a, b) => a.start - b.start || b.end - a.end - (b.dimIndex - a.dimIndex))
  const deduped: typeof spans = []
  let cursor = 0
  for (const s of spans) {
    if (s.start >= cursor) {
      deduped.push(s)
      cursor = s.end
    }
  }
  return deduped
}
