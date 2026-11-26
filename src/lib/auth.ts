import type { FastifyReply, FastifyRequest } from 'fastify'
import { env, normalizeIp } from '../lib/env.js'

/**
 * Só deixa passar se o IP de origem estiver em ALLOWED_IPS.
 *
 * request.ip já respeita a opção `trustProxy` do Fastify:
 *  - TRUST_PROXY=false -> IP do socket (não dá pra forjar via header)
 *  - TRUST_PROXY=true  -> IP vindo de X-Forwarded-For (só use atrás de proxy confiável)
 */
export async function requireAllowedIp(request: FastifyRequest, reply: FastifyReply) {
  const ip = normalizeIp(request.ip)

  if (!env.allowedIps.includes(ip)) {
    request.log.warn({ ip }, 'tentativa de criar post com IP não autorizado')
    return reply.status(403).send({ error: 'Forbidden' })
  }
}
