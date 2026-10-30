// Tests for medication reminders: scheduled doses, the ones waiting to be
// marked, the next one and how a course ends:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  doseId,
  dosesLeft,
  dosesOn,
  expectedEnd,
  isFinished,
  lastDay,
  nextDose,
  upcomingDoses,
  waitingDoses,
} from '../app/lib/utils/medication-schedule.ts'

const today = '2026-10-18'

const antibiotic = {
  id: 'a',
  times: ['20:00', '08:00'],
  everyDays: 1,
  start: '2026-10-17',
  course: { kind: 'days', days: 5 },
}

const mark = (medicationId, date, time, status = 'taken') => ({
  id: doseId(medicationId, date, time),
  medicationId,
  date,
  time,
  status,
})

describe('scheduled doses', () => {
  test('every day at each time, in order, within the course', () => {
    assert.deepEqual(dosesOn(antibiotic, [], today), [
      { date: today, time: '08:00', status: undefined },
      { date: today, time: '20:00', status: undefined },
    ])
    assert.deepEqual(dosesOn(antibiotic, [], '2026-10-16'), [])
    assert.equal(lastDay(antibiotic), '2026-10-21')
    assert.deepEqual(dosesOn(antibiotic, [], '2026-10-22'), [])
  })

  test('every few days counts from the start', () => {
    const weekly = {
      id: 'w',
      times: ['07:00'],
      everyDays: 7,
      start: '2026-10-01',
      course: { kind: 'ongoing' },
    }
    assert.equal(dosesOn(weekly, [], '2026-10-15').length, 1)
    assert.equal(dosesOn(weekly, [], today).length, 0)
    assert.equal(lastDay(weekly), undefined)
  })

  test('a skipped day every few days moves the cycle to the next day', () => {
    const everyOther = {
      id: 'e',
      times: ['17:00'],
      everyDays: 2,
      start: '2026-10-28',
      course: { kind: 'ongoing' },
    }
    const friday = '2026-10-30'
    const skipped = [mark('e', friday, '17:00', 'skipped')]
    assert.equal(dosesOn(everyOther, [], '2026-11-01').length, 1)
    assert.equal(dosesOn(everyOther, skipped, '2026-10-31').length, 1)
    assert.equal(dosesOn(everyOther, skipped, '2026-11-01').length, 0)
    assert.equal(dosesOn(everyOther, skipped, '2026-11-02').length, 1)
    assert.equal(
      nextDose({
        medication: everyOther,
        doses: skipped,
        today: friday,
        now: '18:00',
      })?.date,
      '2026-10-31',
    )
    // Taking one of two times that day keeps the cycle.
    const twice = { ...everyOther, times: ['08:00', '17:00'] }
    const partly = [mark('e', friday, '08:00'), ...skipped]
    assert.equal(dosesOn(twice, partly, '2026-10-31').length, 0)
  })

  test('marks show on their dose', () => {
    const doses = [mark('a', today, '08:00', 'skipped')]
    assert.equal(dosesOn(antibiotic, doses, today)[0].status, 'skipped')
  })

  test('stopping early ends the course that day', () => {
    const stopped = { ...antibiotic, stopped: '2026-10-18' }
    assert.equal(lastDay(stopped), '2026-10-18')
    assert.equal(isFinished(stopped, [], '2026-10-19'), true)
    assert.equal(isFinished(stopped, [], today), false)
  })
})

describe('doses waiting to be marked', () => {
  test('due ones from yesterday and today, oldest first', () => {
    const waiting = waitingDoses({
      medications: [antibiotic],
      doses: [mark('a', '2026-10-17', '08:00')],
      today,
      now: '09:15',
    })
    assert.deepEqual(
      waiting.map(({ date, time }) => `${date} ${time}`),
      ['2026-10-17 20:00', '2026-10-18 08:00'],
    )
  })

  test('nothing before its time or once marked', () => {
    assert.deepEqual(
      waitingDoses({
        medications: [{ ...antibiotic, start: today }],
        doses: [mark('a', today, '08:00', 'skipped')],
        today,
        now: '19:59',
      }),
      [],
    )
  })

  test('older missed doses are left out', () => {
    const waiting = waitingDoses({
      medications: [
        { ...antibiotic, start: '2026-10-10', course: { kind: 'ongoing' } },
      ],
      doses: [],
      today,
      now: '07:00',
    })
    assert.deepEqual(
      waiting.map(({ date }) => date),
      ['2026-10-17', '2026-10-17'],
    )
  })
})

describe('the next dose', () => {
  test('later today, or the next scheduled day', () => {
    assert.deepEqual(
      nextDose({ medication: antibiotic, doses: [], today, now: '09:00' }),
      { date: today, time: '20:00', status: undefined },
    )
    const weekly = {
      id: 'w',
      times: ['07:00'],
      everyDays: 7,
      start: '2026-10-15',
      course: { kind: 'ongoing' },
    }
    assert.equal(
      nextDose({ medication: weekly, doses: [], today, now: '09:00' })?.date,
      '2026-10-22',
    )
  })

  test('a course starting later starts on its first day', () => {
    assert.equal(
      nextDose({
        medication: { ...antibiotic, start: '2026-10-25' },
        doses: [],
        today,
        now: '23:00',
      })?.date,
      '2026-10-25',
    )
  })

  test('none once the course is over', () => {
    assert.equal(
      nextDose({
        medication: antibiotic,
        doses: [],
        today: '2026-10-21',
        now: '21:00',
      }),
      undefined,
    )
  })
})

describe('a course of doses', () => {
  const pills = {
    id: 'p',
    times: ['08:00', '20:00'],
    everyDays: 1,
    start: '2026-10-17',
    course: { kind: 'doses', doses: 5 },
  }

  test('only taken doses count; skipped ones add a day', () => {
    const doses = [
      mark('p', '2026-10-17', '08:00'),
      mark('p', '2026-10-17', '20:00', 'skipped'),
      mark('p', today, '08:00'),
    ]
    assert.equal(dosesLeft(pills, doses, today), 3)
    // 20:00 today, then both tomorrow.
    assert.equal(expectedEnd(pills, doses, today), '2026-10-19')
    assert.equal(isFinished(pills, doses, today), false)
  })

  test('ends when every dose is taken', () => {
    const doses = [
      mark('p', '2026-10-17', '08:00'),
      mark('p', '2026-10-17', '20:00'),
      mark('p', today, '08:00'),
      mark('p', today, '20:00'),
      mark('p', '2026-10-19', '08:00'),
    ]
    assert.equal(dosesLeft(pills, doses, '2026-10-19'), 0)
    assert.equal(isFinished(pills, doses, '2026-10-19'), true)
    assert.deepEqual(
      dosesOn(pills, doses, '2026-10-19').map(({ time }) => time),
      ['08:00'],
    )
    assert.equal(
      nextDose({ medication: pills, doses, today: '2026-10-19', now: '09:00' }),
      undefined,
    )
  })
})

describe('doses left in a dated course', () => {
  test('scheduled from today on, less those already marked', () => {
    // 18th to 21st: 4 days of 2.
    assert.equal(dosesLeft(antibiotic, [], today), 8)
    assert.equal(dosesLeft(antibiotic, [mark('a', today, '08:00')], today), 7)
    assert.equal(dosesLeft(antibiotic, [], '2026-10-22'), 0)
  })

  test('none to count in an ongoing course', () => {
    assert.equal(
      dosesLeft({ ...antibiotic, course: { kind: 'ongoing' } }, [], today),
      undefined,
    )
  })
})

describe('doses to push', () => {
  test('those still to come, from now on, unmarked', () => {
    const doses = [mark('a', '2026-10-18', '20:00')]
    assert.deepEqual(
      upcomingDoses({ medication: antibiotic, doses, today, now: '07:00' }),
      [
        { date: '2026-10-18', time: '08:00' },
        { date: '2026-10-19', time: '08:00' },
        { date: '2026-10-19', time: '20:00' },
        { date: '2026-10-20', time: '08:00' },
        { date: '2026-10-20', time: '20:00' },
        { date: '2026-10-21', time: '08:00' },
        { date: '2026-10-21', time: '20:00' },
      ],
    )
  })

  test('no more than a course of doses has left, nor than the limit', () => {
    const course = { ...antibiotic, course: { kind: 'doses', doses: 3 } }
    const doses = [mark('a', '2026-10-17', '08:00')]
    assert.deepEqual(
      upcomingDoses({ medication: course, doses, today, now: '12:00' }),
      [
        { date: '2026-10-18', time: '20:00' },
        { date: '2026-10-19', time: '08:00' },
      ],
    )
    const ongoing = { ...antibiotic, course: { kind: 'ongoing' } }
    assert.equal(
      upcomingDoses({ medication: ongoing, doses: [], today, now: '12:00' })
        .length,
      27,
    )
    assert.equal(
      upcomingDoses({
        medication: ongoing,
        doses: [],
        today,
        now: '12:00',
        limit: 5,
      }).length,
      5,
    )
  })
})
