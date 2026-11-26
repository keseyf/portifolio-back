import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './lib/env.js'
import { prisma } from './lib/prisma.js'
import { postsRoutes } from './routes/posts.js'

const app = Fastify({
  logger: true,
  trustProxy: env.trustProxy,
  bodyLimit: 5 * 1024 * 1024, // posts longos (5 MB)
})

await app.register(cors, {
  origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
})

app.get('/health', async () => ({ ok: true }))
await app.register(postsRoutes)

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

try {
  await app.listen({ port: env.port, host: env.host })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
