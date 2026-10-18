// Tests for health reminders and their calendar files:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  dueReminders,
  reminderCalendar,
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

describe('calendar files', () => {
  const now = '2026-10-12T03:04:05.000Z'

  test('a timed measurement repeats every few days and alerts on time', () => {
    const ics = reminderCalendar({
      uid: 'w',
      title: 'Weigh Rara',
      description: 'Catat Saja, Rara',
      start: '2026-10-15',
      time: '07:30',
      everyDays: 7,
      now,
    })
    assert.ok(ics.endsWith('\r\n'))
    const lines = ics.trimEnd().split('\r\n')
    for (const line of [
      'BEGIN:VCALENDAR',
      'UID:w@catatsaja',
      'DTSTAMP:20261012T030405Z',
      'DTSTART:20261015T073000',
      'DURATION:PT15M',
      'RRULE:FREQ=DAILY;INTERVAL=7',
      'SUMMARY:Weigh Rara',
      String.raw`DESCRIPTION:Catat Saja\, Rara`,
      'TRIGGER:PT0M',
      'END:VCALENDAR',
    ])
      assert.ok(lines.includes(line), `has ${line}`)
  })

  test('an all-day reminder alerts at 09:00 and need not repeat', () => {
    const lines = reminderCalendar({
      uid: 'p',
      title: 'Period expected; check',
      description: '',
      start: '2026-10-31',
      now,
    })
      .trimEnd()
      .split('\r\n')
    assert.ok(lines.includes('DTSTART;VALUE=DATE:20261031'))
    assert.ok(lines.includes('DTEND;VALUE=DATE:20261101'))
    assert.ok(lines.includes('TRIGGER;RELATED=START:PT9H'))
    assert.ok(lines.includes(String.raw`SUMMARY:Period expected\; check`))
    assert.ok(!lines.some((line) => line.startsWith('RRULE')))
  })

  test('long lines are folded at 75 bytes without splitting characters', () => {
    const title =
      'Timbang berat badan dan ukur tinggi badan Rara — pengingat mingguan ✓✓✓'
    const ics = reminderCalendar({
      uid: 'x',
      title,
      description: '',
      start: '2026-10-15',
      now,
    })
    for (const line of ics.trimEnd().split('\r\n'))
      assert.ok(new TextEncoder().encode(line).length <= 75, line)
    const unfolded = ics.replaceAll('\r\n ', '')
    assert.ok(unfolded.includes(`SUMMARY:${title}`))
  })
})

describe('a medicine in the calendar', () => {
  test('an event for each time, repeating until the course ends', () => {
    const lines = reminderCalendar({
      uid: 'm',
      title: 'Amoxicillin',
      description: '',
      start: '2026-10-18',
      times: ['08:00', '20:00'],
      everyDays: 1,
      until: '2026-10-21',
      now: '2026-10-18T01:00:00.000Z',
    })
      .trimEnd()
      .split('\r\n')
    assert.equal(lines.filter((line) => line === 'BEGIN:VEVENT').length, 2)
    assert.ok(lines.includes('UID:m-0800@catatsaja'))
    assert.ok(lines.includes('DTSTART:20261018T200000'))
    assert.ok(
      lines.includes('RRULE:FREQ=DAILY;INTERVAL=1;UNTIL=20261021T235959'),
    )
  })
})
