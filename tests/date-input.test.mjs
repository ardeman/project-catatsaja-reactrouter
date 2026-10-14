import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  dateFormats,
  formatDateInput,
  maskDateInput,
  parseDateInput,
} from '../app/lib/utils/date-input.ts'

test('all formats turn typed digits into the same stored date', () => {
  for (const format of dateFormats) {
    const display = formatDateInput('2026-10-14', format)
    if (!format.includes('MMM')) {
      assert.equal(
        maskDateInput(display.replaceAll(/\D/g, ''), format),
        display,
      )
    }
    assert.equal(maskDateInput(display, format), display)
    assert.equal(parseDateInput(display, format), '2026-10-14')
  }
})

test('partial typing adds separators only between populated parts', () => {
  assert.equal(maskDateInput('1', 'DD-MM-YYYY'), '1')
  assert.equal(maskDateInput('141', 'DD-MM-YYYY'), '14-1')
  assert.equal(maskDateInput('141020', 'DD-MM-YYYY'), '14-10-20')
  assert.equal(parseDateInput('14-10-20', 'DD-MM-YYYY'), undefined)
  assert.equal(parseDateInput('', 'DD-MM-YYYY'), '')
})

test('impossible dates are refused and leap days follow the calendar', () => {
  for (const value of [
    '31-04-2026',
    '29-02-2026',
    '00-10-2026',
    '14-13-2026',
    '14-10-0000',
  ]) {
    assert.equal(parseDateInput(value, 'DD-MM-YYYY'), undefined)
  }
  assert.equal(parseDateInput('29-02-2024', 'DD-MM-YYYY'), '2024-02-29')
  assert.equal(parseDateInput('1900-02-29', 'YYYY-MM-DD'), undefined)
  assert.equal(parseDateInput('2000-02-29', 'YYYY-MM-DD'), '2000-02-29')
})

test('slash formats add slashes and accept dates pasted with slashes', () => {
  assert.equal(maskDateInput('10142026', 'MM/DD/YYYY'), '10/14/2026')
  assert.equal(maskDateInput('141', 'DD/MM/YYYY'), '14/1')
  assert.equal(parseDateInput('10/14/2026', 'MM/DD/YYYY'), '2026-10-14')
  assert.equal(parseDateInput('02/29/2026', 'MM/DD/YYYY'), undefined)
  assert.equal(parseDateInput('2024/02/29', 'YYYY/MM/DD'), '2024-02-29')
})

test('English and Indonesian month names work in every preferred format', () => {
  for (const format of dateFormats) {
    for (const text of [
      '12 Mar 2026',
      '12 March 2026',
      '12 Maret 2026',
      '12maret2026',
    ]) {
      assert.equal(parseDateInput(text, format), '2026-03-12')
    }
  }
  assert.equal(
    formatDateInput('2026-03-12', 'DD MMMM YYYY', 'id'),
    '12 Maret 2026',
  )
  assert.equal(maskDateInput('12Mar', 'DD MMM YYYY'), '12 Mar')
  assert.equal(maskDateInput('12032026', 'DD MMMM YYYY', 'id'), '12 Maret 2026')
  assert.equal(maskDateInput('12 March 2026', 'MM/DD/YYYY'), '03/12/2026')
  assert.equal(parseDateInput('31 April 2026', 'DD MMMM YYYY'), undefined)
  assert.equal(parseDateInput('12 Unknown 2026', 'DD MMM YYYY'), undefined)
})
