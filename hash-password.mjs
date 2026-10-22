// Usage: node hash-password.mjs   (reads the password from stdin; prints the PASSWORD_HASH value)
import { randomBytes, scryptSync } from 'node:crypto'
let input = ''
for await (const chunk of process.stdin) input += chunk
const password = input.replace(/\r?\n$/, '')
if (password.length < 12) { console.error('Use at least 12 characters'); process.exit(1) }
const salt = randomBytes(16)
console.log(`scrypt$${salt.toString('base64url')}$${scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString('base64url')}`)
