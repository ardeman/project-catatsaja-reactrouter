// Suggests an entry's category from its description, on the device: a
// naive Bayes classifier (the method of spam filters) trained on the
// person's own entries, plus a starter word list for those with few
// entries. Free, instant, works offline, and nothing leaves the device
// (descriptions may be end-to-end encrypted). Pure logic, no app imports,
// so it can be tested on its own (tests/category-classifier.test.mjs).

type TType = 'income' | 'expense'

type TEntry = { description: string; category: string; type: TType }

type TCategory = { key: string; type: TType }

export type TSuggestion = {
  category: string
  type: TType
  // 0 to 1: how sure the classifier is, against the other categories.
  confidence: number
}

// Words that say nothing about a category.
const STOPWORDS = new Set([
  'di',
  'ke',
  'dari',
  'dan',
  'yang',
  'untuk',
  'buat',
  'utk',
  'dengan',
  'dgn',
  'beli',
  'bayar',
  'pembelian',
  'pembayaran',
  'the',
  'for',
  'and',
  'of',
  'to',
  'at',
  'in',
  'on',
  'a',
  'an',
  'buy',
  'pay',
  'payment',
  'via',
  'pakai',
  'pake',
  'ini',
  'itu',
  'aja',
  'saja',
  'lagi',
  'juga',
  'my',
])

export const tokenize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(
      (word) => word.length >= 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word),
    )

// Each category's starter words weigh as much in total as a few of the
// person's entries, whatever the list's length (so long lists don't dilute
// their words): enough for a new account, soon outweighed by real history.
const SEED_MASS = 3
// For words a category hasn't seen: small, so one telling word counts.
const SMOOTHING = 0.001

type TModel = {
  counts: Map<string, Map<string, number>>
  totals: Map<string, number>
  // The person's entries per category: how likely a category is before its
  // words (every category alike until there is history).
  documents: Map<string, number>
  vocabulary: Set<string>
  documentCount: number
}

const add = (
  model: TModel,
  category: string,
  words: string[],
  weight: number,
  isEntry: boolean,
) => {
  let counts = model.counts.get(category)
  if (!counts) {
    counts = new Map()
    model.counts.set(category, counts)
  }
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + weight)
    model.totals.set(category, (model.totals.get(category) ?? 0) + weight)
    model.vocabulary.add(word)
  }
  if (!isEntry) return
  model.documents.set(category, (model.documents.get(category) ?? 0) + 1)
  model.documentCount += 1
}

export const trainClassifier = (
  history: TEntry[],
  keywords: Record<string, string[]>,
): TModel => {
  const model: TModel = {
    counts: new Map(),
    totals: new Map(),
    documents: new Map(),
    vocabulary: new Set(),
    documentCount: 0,
  }
  for (const [category, words] of Object.entries(keywords)) {
    const tokens = words.flatMap((word) => tokenize(word))
    add(model, category, tokens, SEED_MASS / Math.max(tokens.length, 1), false)
  }
  for (const entry of history)
    add(model, entry.category, tokenize(entry.description), 1, true)
  return model
}

// The most likely categories for a description, best first. Words the
// model has never seen are left out; none known: no suggestion.
export const classify = (
  model: TModel,
  description: string,
  categories: TCategory[],
) => {
  const words = tokenize(description).filter((word) =>
    model.vocabulary.has(word),
  )
  if (words.length === 0) return []
  const size = model.vocabulary.size
  const known = categories.filter((category) => model.counts.has(category.key))
  const scored = known.map((category) => {
    const counts = model.counts.get(category.key)
    const total = model.totals.get(category.key) ?? 0
    let score = Math.log(
      ((model.documents.get(category.key) ?? 0) + 1) /
        (model.documentCount + known.length),
    )
    for (const word of words)
      score += Math.log(
        ((counts?.get(word) ?? 0) + SMOOTHING) / (total + SMOOTHING * size),
      )
    return { ...category, score }
  })
  if (scored.length === 0) return []
  // Scores to probabilities (softmax), for a confidence.
  const best = Math.max(...scored.map((item) => item.score))
  const exp = scored.map((item) => Math.exp(item.score - best))
  const sum = exp.reduce((total, value) => total + value, 0)
  return scored
    .map((item, index): TSuggestion => ({
      category: item.key,
      type: item.type,
      confidence: exp[index] / sum,
    }))
    .toSorted((a, b) => b.confidence - a.confidence)
}

// The suggestion for a description: a past entry with the same words wins
// outright; otherwise the classifier's best guess, if it is sure enough.
export const suggestCategory = ({
  description,
  history,
  keywords,
  categories,
  type,
}: {
  description: string
  // Newest first.
  history: TEntry[]
  keywords: Record<string, string[]>
  categories: TCategory[]
  // Only categories of this type.
  type?: TType
}): TSuggestion | undefined => {
  const text = tokenize(description).join(' ')
  if (!text) return
  const exact = history.find(
    (entry) =>
      tokenize(entry.description).join(' ') === text &&
      (!type || entry.type === type),
  )
  if (exact)
    return { category: exact.category, type: exact.type, confidence: 1 }
  const model = trainClassifier(history, keywords)
  const [best] = classify(
    model,
    description,
    type ? categories.filter((category) => category.type === type) : categories,
  )
  // A coin toss between categories is no suggestion.
  return best && best.confidence >= 0.4 ? best : undefined
}
