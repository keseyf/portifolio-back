import 'dotenv/config'

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Normaliza IPv6 mapeado de IPv4 (::ffff:1.2.3.4 -> 1.2.3.4). */
export function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  host: process.env.HOST ?? '0.0.0.0',
  trustProxy: process.env.TRUST_PROXY === 'true',
  allowedIps: list(process.env.ALLOWED_IPS).map(normalizeIp),
  corsOrigins: list(process.env.CORS_ORIGINS),
}
