// Writes functions/package-lock.json, or checks it with --check.
//
// Cloud Build installs the deployed functions with npm, outside this pnpm
// workspace, so without a lockfile of their own it would take the newest
// versions their ranges allow, including releases younger than pnpm's
// one-day minimum. npm's --before keeps that minimum here.

import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const functions = path.resolve(import.meta.dirname, '../functions')
const manifest = path.join(functions, 'package.json')
const lockfile = path.join(functions, 'package-lock.json')

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

const sameRanges = (a = {}, b = {}) =>
  JSON.stringify(Object.entries(a).sort()) ===
  JSON.stringify(Object.entries(b).sort())

if (process.argv.includes('--check')) {
  const wanted = readJson(manifest)
  let root
  try {
    root = readJson(lockfile).packages[''] ?? {}
  } catch {
    root = undefined
  }
  if (
    !root ||
    !sameRanges(root.dependencies, wanted.dependencies) ||
    !sameRanges(root.devDependencies, wanted.devDependencies)
  ) {
    console.error(
      'functions/package-lock.json does not match functions/package.json. Run `pnpm lock:functions`.',
    )
    process.exit(1)
  }
} else {
  const before = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const directory = mkdtempSync(path.join(tmpdir(), 'functions-lock-'))
  try {
    copyFileSync(manifest, path.join(directory, 'package.json'))
    execFileSync(
      'npm',
      [
        'install',
        '--package-lock-only',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        `--before=${before}`,
      ],
      { cwd: directory, stdio: 'inherit' },
    )
    writeFileSync(
      lockfile,
      readFileSync(path.join(directory, 'package-lock.json')),
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
