import crypto from 'crypto'

const KEY = Buffer.from(
  process.env.FACE_ENCRYPTION_KEY || '0'.repeat(64),
  'hex'
)

export function encryptFaceDescriptor(descriptor: number[]): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const data = JSON.stringify(descriptor)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decryptFaceDescriptor(stored: string): number[] {
  const [ivHex, tagHex, encHex] = stored.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

export function faceDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateShareCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}
