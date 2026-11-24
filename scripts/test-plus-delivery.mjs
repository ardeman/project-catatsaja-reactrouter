import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Builds functions, writes emulator secrets, and runs deliverPlus smoke
// against Firestore + Functions emulators (needs Java 21).

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const secretFile = join(root, 'functions/.secret.local')
const deliverySecret = 'local-delivery-secret'
const checkoutSecret = 'local-checkout-secret'

writeFileSync(
  secretFile,
  `DAHLUNAS_DELIVERY_SECRET=${deliverySecret}\nPLUS_CHECKOUT_SECRET=${checkoutSecret}\n`,
)

const run = (command, args, env = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    )
  })

await run('pnpm', ['build:functions'])
await run(
  'pnpm',
  [
    'dlx',
    'firebase-tools@15.33.0',
    'emulators:exec',
    '--only',
    'firestore,functions',
    '--project',
    'demo-catatsaja',
    'node --test tests/plus-delivery.emulator.test.mjs',
  ],
  { DAHLUNAS_DELIVERY_SECRET: deliverySecret, PATH: process.env.PATH },
)
