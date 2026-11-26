import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { requireAllowedIp } from '../lib/auth.js'

/** ~200 palavras por minuto, mínimo 1. */
function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// Campos da listagem (sem o conteúdo, pra ficar leve)
const listSelect = {
  id: true,
  title: true,
  description: true,
  tags: true,
  readingTime: true,
  publishedAt: true,
} as const

interface CreatePostBody {
  title: string
  description: string
  content: string
  tags?: string[]
  readingTime?: number
  publishedAt?: string
}

export async function postsRoutes(app: FastifyInstance) {
  // Lista de postagens (página "Blog")
  app.get('/posts', async () => {
    return prisma.post.findMany({
      select: listSelect,
      orderBy: { publishedAt: 'desc' },
    })
  })

  // Postagem completa (página /posts/:id)
  app.get<{ Params: { id: number } }>(
    '/posts/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer', minimum: 1 } },
        },
      },
    },
    async (request, reply) => {
      const post = await prisma.post.findUnique({ where: { id: request.params.id } })
      if (!post) return reply.status(404).send({ error: 'Post não encontrado' })
      return post
    },
  )

  // Criação: só o(s) IP(s) em ALLOWED_IPS
  app.post<{ Body: CreatePostBody }>(
    '/posts',
    {
      preHandler: requireAllowedIp,
      schema: {
        body: {
          type: 'object',
          required: ['title', 'description', 'content'],
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', minLength: 1, maxLength: 500 },
            content: { type: 'string', minLength: 1 },
            tags: { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 20 },
            readingTime: { type: 'integer', minimum: 1 },
            publishedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const { title, description, content, tags, readingTime, publishedAt } = request.body

      const post = await prisma.post.create({
        data: {
          title,
          description,
          content,
          tags: tags ?? [],
          readingTime: readingTime ?? estimateReadingTime(content),
          ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}),
        },
      })

      return reply.status(201).send(post)
    },
  )
}
