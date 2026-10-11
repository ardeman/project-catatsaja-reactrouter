// Tests for the on-device category suggestions:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { categoryKeywords } from '../app/lib/constants/category-keywords.ts'
import {
  classify,
  suggestCategory,
  tokenize,
  trainClassifier,
} from '../app/lib/utils/category-classifier.ts'

const INCOME = new Set([
  'income',
  'bonus',
  'business',
  'freelance',
  'rent',
  'interest',
  'investmentReturns',
  'crypto',
  'exchangeGain',
  'giftReceived',
  'refund',
])
const categories = Object.keys(categoryKeywords).map((key) => ({
  key,
  type: INCOME.has(key) ? 'income' : 'expense',
}))
const typeOf = (key) => (INCOME.has(key) ? 'income' : 'expense')
const entry = (description, category) => ({
  description,
  category,
  type: typeOf(category),
})
const suggest = (description, history = [], type) =>
  suggestCategory({
    description,
    history,
    keywords: categoryKeywords,
    categories,
    type,
  })

// Typical descriptions (Indonesian and English) and the category people
// expect, for an account with no entries yet.
const samples = [
  ['Makan siang nasi padang', 'fnb'],
  ['Kopi Starbucks', 'fnb'],
  ['GoFood ayam geprek', 'fnb'],
  ['Lunch with team', 'fnb'],
  ['Boba', 'fnb'],
  ['Belanja Indomaret', 'groceries'],
  ['Sayur dan buah di pasar', 'groceries'],
  ['Beras 5kg', 'groceries'],
  ['Baju Uniqlo', 'shopping'],
  ['Checkout Shopee', 'shopping'],
  ['Kipas angin', 'tools'],
  ['Beli lemari IKEA', 'tools'],
  ['Top up GoPay', 'emoney'],
  ['Grab ke kantor', 'transport'],
  ['Bensin pertalite', 'transport'],
  ['Parkir mall', 'transport'],
  ['Tiket kereta Bandung', 'transport'],
  ['Netflix', 'entertainment'],
  ['Spotify premium', 'entertainment'],
  ['Hotel di Bali', 'vacation'],
  ['Tiket pesawat Garuda', 'vacation'],
  ['Token listrik PLN', 'bills'],
  ['Pulsa Telkomsel', 'bills'],
  ['Bayar kos', 'bills'],
  ['Laundry kiloan', 'laundry'],
  ['Obat di apotek', 'health'],
  ['Dokter gigi', 'health'],
  ['Zakat fitrah', 'social'],
  ['Kondangan teman', 'social'],
  ['BPJS kesehatan', 'insurance'],
  ['Beli emas Antam', 'investment'],
  ['SPP sekolah', 'education'],
  ['Popok anak', 'family'],
  ['Cicilan KPR', 'loan'],
  ['Cicilan citra living (bni)', 'loan'],
  ['Biaya admin bank', 'fees'],
  ['Gaji bulan Oktober', 'income'],
  ['THR', 'bonus'],
  ['Penjualan toko online', 'business'],
  ['Invoice klien project', 'freelance'],
  ['Sewa apartemen dari penyewa', 'rent'],
  ['Bunga deposito', 'interest'],
  ['Dividen saham', 'investmentReturns'],
  ['Jual bitcoin', 'crypto'],
  ['Selisih kurs', 'exchangeGain'],
  ['Angpao lebaran', 'giftReceived'],
  ['Refund Shopee', 'refund'],
  ['Cashback OVO', 'refund'],
]

describe('category suggestions', () => {
  test('a new account gets the expected category for typical descriptions', () => {
    const misses = samples.filter(
      ([text, expected]) =>
        suggest(text, [], typeOf(expected))?.category !== expected,
    )
    const accuracy = 1 - misses.length / samples.length
    assert.ok(
      accuracy >= 0.95,
      `${Math.round(accuracy * 100)}% right; missed: ${misses.map(([text]) => text).join(', ')}`,
    )
  })

  test('ignores filler words, numbers and accents', () => {
    assert.deepEqual(tokenize('Beli 2 kopi di Café'), ['kopi', 'cafe'])
  })

  test('unknown words give no suggestion rather than a guess', () => {
    assert.equal(suggest('Mixue'), undefined)
    const model = trainClassifier([], categoryKeywords)
    assert.deepEqual(classify(model, 'zzz qqq', categories), [])
  })

  test("learns from the person's own entries", () => {
    assert.equal(
      suggest('Mixue es krim', [entry('Mixue', 'fnb')])?.category,
      'fnb',
    )
  })

  test('the same description as a past entry wins outright', () => {
    const result = suggest('potong rambut', [
      entry('Potong rambut', 'otherExpenses'),
    ])
    assert.equal(result?.category, 'otherExpenses')
    assert.equal(result?.confidence, 1)
  })

  test("the person's history outweighs the starter words", () => {
    const history = [
      entry('kopi bubuk', 'groceries'),
      entry('kopi kapal api', 'groceries'),
      entry('kopi sachet indomaret', 'groceries'),
    ]
    assert.equal(suggest('kopi sachet', history)?.category, 'groceries')
  })

  test('a word of both types is never sure enough to switch type', () => {
    const any = suggest('sewa')
    assert.ok(!any || any.confidence < 0.9, 'not sure without context')
    assert.equal(suggest('sewa', [], 'expense')?.category, 'bills')
    assert.equal(suggest('sewa', [], 'income')?.category, 'rent')
  })
})
