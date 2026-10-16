// Tests for the period calendar's days and predicted windows:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  cycleCalendar,
  cycleToday,
  cycleWindows,
  periodActions,
} from '../app/lib/utils/cycle-calendar.ts'

const cycle = {
  nextStart: '2026-11-01',
  cycleLength: 28,
  periodLength: 5,
  shortestCycle: 26,
  longestCycle: 31,
}

describe('cycleWindows', () => {
  test('places ovulation 14 days before the period', () => {
    const windows = cycleWindows(cycle, cycle.nextStart)
    assert.deepEqual(windows.predicted, ['2026-11-01', '2026-11-05'])
    assert.deepEqual(windows.ovulation, ['2026-10-18', '2026-10-18'])
    assert.deepEqual(windows.ovulationWindow, ['2026-10-17', '2026-10-19'])
    assert.deepEqual(windows.fertile, ['2026-10-13', '2026-10-19'])
  })

  test('widens the possible days by how much cycles varied', () => {
    // Two days earlier at least, three later (31 against 28).
    assert.deepEqual(cycleWindows(cycle, cycle.nextStart).possible, [
      '2026-10-30',
      '2026-11-08',
    ])
  })
})

describe('cycleCalendar', () => {
  const periods = [{ date: '2026-10-04', end: '2026-10-08' }]

  test('shows logged days in the past and predictions from today', () => {
    const days = cycleCalendar(periods, cycle, '2026-10-16', '2026-11-30')
    assert.equal(days.get('2026-10-05'), 'period')
    // Before today: no predictions.
    assert.equal(days.get('2026-10-14'), undefined)
    assert.equal(days.get('2026-10-16'), 'fertile')
    assert.equal(days.get('2026-10-17'), 'ovulationWindow')
    assert.equal(days.get('2026-10-18'), 'ovulation')
    assert.equal(days.get('2026-10-31'), 'possible')
    assert.equal(days.get('2026-11-01'), 'predicted')
    assert.equal(days.get('2026-11-07'), 'possible')
    // The cycle after, up to the end of the range.
    assert.equal(days.get('2026-11-15'), 'ovulation')
    assert.equal(days.get('2026-11-29'), 'predicted')
    assert.equal(days.get('2026-12-27'), undefined)
  })

  test('predicts the rest of a period that has no end yet', () => {
    const ongoing = [{ date: '2026-10-14' }]
    const days = cycleCalendar(ongoing, undefined, '2026-10-16', '2026-10-31')
    assert.equal(days.get('2026-10-16'), 'period')
    assert.equal(days.get('2026-10-17'), 'predicted')
    assert.equal(days.get('2026-10-18'), 'predicted')
    assert.equal(days.get('2026-10-19'), undefined)
  })
})

describe('periodActions', () => {
  const today = '2026-10-16'
  const types = (periods, day) =>
    periodActions(periods, day, today, 5).map((action) =>
      action.id ? `${action.type}:${action.id}` : action.type,
    )

  test('starts a period on an empty day, never ahead of today', () => {
    assert.deepEqual(types([], '2026-10-10'), ['start'])
    assert.deepEqual(types([], '2026-10-17'), [])
  })

  test('ends or removes a period from its days', () => {
    const periods = [{ id: 'a', date: '2026-10-10' }]
    assert.deepEqual(types(periods, '2026-10-10'), ['end:a', 'remove:a'])
    assert.deepEqual(types(periods, '2026-10-12'), ['end:a'])
    // Past the predicted days: still its last day, or a new start.
    assert.deepEqual(types(periods, '2026-10-15'), ['start', 'end:a'])
  })

  test('undoes a logged last day', () => {
    const periods = [{ id: 'a', date: '2026-10-01', end: '2026-10-04' }]
    assert.deepEqual(types(periods, '2026-10-04'), ['clearEnd:a'])
    assert.deepEqual(types(periods, '2026-10-03'), ['end:a'])
  })

  test('moves a start back instead of adding one just before it', () => {
    const periods = [{ id: 'a', date: '2026-10-10' }]
    assert.deepEqual(types(periods, '2026-10-08'), ['start:a'])
    assert.deepEqual(types(periods, '2026-09-20'), ['start'])
  })
})

describe('cycleToday', () => {
  test('counts the day of a period and its expected last day', () => {
    const periods = [{ date: '2026-10-15' }]
    assert.deepEqual(cycleToday(periods, cycle, '2026-10-16'), {
      kind: 'period',
      day: 2,
      end: '2026-10-19',
      isEndLogged: false,
    })
  })

  test('tells ovulation and the fertile window', () => {
    assert.equal(cycleToday([], cycle, '2026-10-18').kind, 'ovulation')
    assert.deepEqual(cycleToday([], cycle, '2026-10-14'), {
      kind: 'fertile',
      fertileEnd: '2026-10-19',
      ovulation: '2026-10-18',
    })
    assert.equal(cycleToday([], cycle, '2026-10-25').kind, 'next')
  })
})
