import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })
    redisClient.on('error', (err) => console.error('Redis client error:', err))
    await redisClient.connect()
  }
  return redisClient
}

export async function publishToSession(sessionId: string, message: object) {
  const client = await getRedisClient()
  await client.publish(`session:${sessionId}`, JSON.stringify(message))
}

export async function subscribeToSession(
  sessionId: string,
  onMessage: (message: string) => void
) {
  const subscriber = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  await subscriber.connect()
  await subscriber.subscribe(`session:${sessionId}`, onMessage)
  return subscriber
}
