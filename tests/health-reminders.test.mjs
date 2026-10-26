// Tests for health reminders and their push times:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  dueReminders,
  reminderPushAt,
  reminderStatus,
} from '../app/lib/utils/health-reminders.ts'

const today = '2026-10-12'
const weigh = { id: 'w', kind: 'body', everyDays: 7, time: '07:30' }
const entries = [
  { kind: 'body', date: '2026-09-28' },
  { kind: 'body', date: '2026-10-08' },
  { kind: 'glucose', date: '2026-10-12' },
]

describe('when a reminder is due', () => {
  test('a measurement is due its interval after the last one', () => {
    assert.deepEqual(reminderStatus({ reminder: weigh, entries, today }), {
      dueDate: '2026-10-15',
      isDue: false,
      lastDate: '2026-10-08',
    })
    assert.equal(
      reminderStatus({
        reminder: { ...weigh, everyDays: 3 },
        entries,
        today,
      }).isDue,
      true,
    )
  })

  test('a measurement never logged is due now', () => {
    assert.deepEqual(
      reminderStatus({
        reminder: { id: 'u', kind: 'uricAcid', everyDays: 30 },
        entries,
        today,
      }),
      { dueDate: today, isDue: true, lastDate: undefined },
    )
  })

  test('a period reminder is due its days before the next period', () => {
    const reminder = { id: 'p', kind: 'period', daysBefore: 2 }
    assert.deepEqual(
      reminderStatus({
        reminder,
        entries,
        today,
        nextPeriodStart: '2026-10-14',
      }),
      { dueDate: '2026-10-12', isDue: true },
    )
    assert.deepEqual(
      reminderStatus({
        reminder,
        entries,
        today,
        nextPeriodStart: '2026-10-20',
      }),
      { dueDate: '2026-10-18', isDue: false },
    )
    assert.deepEqual(reminderStatus({ reminder, entries, today }), {
      isDue: false,
    })
  })

  test('lists the due ones, most overdue first', () => {
    const due = dueReminders({
      reminders: [
        weigh,
        { id: 'g', kind: 'glucose', everyDays: 1 },
        { id: 'c', kind: 'cholesterol', everyDays: 90 },
        { id: 'b2', kind: 'body', everyDays: 2 },
      ],
      entries,
      today,
    })
    assert.deepEqual(
      due.map(({ reminder, status }) => [reminder.id, status.dueDate]),
      [
        ['b2', '2026-10-10'],
        ['c', '2026-10-12'],
      ],
    )
  })
})

describe('when a reminder is pushed', () => {
  const at = (reminder, status, now = '08:00') =>
    reminderPushAt({ reminder, status, today, now })

  test('on its due day at its time, or 09:00 without one', () => {
    assert.deepEqual(at(weigh, { dueDate: '2026-10-15', isDue: false }), {
      date: '2026-10-15',
      time: '07:30',
    })
    const sugar = { id: 'g', kind: 'glucose', everyDays: 1 }
    assert.deepEqual(at(sugar, { dueDate: today, isDue: true }), {
      date: today,
      time: '09:00',
    })
    const period = { id: 'p', kind: 'period', daysBefore: 2 }
    assert.deepEqual(at(period, { dueDate: '2026-10-20', isDue: false }), {
      date: '2026-10-20',
      time: '09:00',
    })
  })

  test('not once it is already due, nor without a due date', () => {
    assert.equal(at(weigh, { dueDate: today, isDue: true }, '07:30'), undefined)
    assert.equal(at(weigh, { dueDate: '2026-10-01', isDue: true }), undefined)
    const period = { id: 'p', kind: 'period', daysBefore: 2 }
    assert.equal(at(period, { isDue: false }), undefined)
  })
})
