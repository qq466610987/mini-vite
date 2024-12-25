import crypto from 'node:crypto'

export function hash(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8)
}