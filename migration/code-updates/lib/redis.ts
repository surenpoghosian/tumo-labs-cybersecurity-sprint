import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;
let isReady = false;

async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts');
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isReady = false;
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
      isReady = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting');
      isReady = false;
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Redis wrapper with error handling
export const redis = {
  async get(key: string): Promise<string | null> {
    try {
      if (!isReady) return null;
      const client = await getRedisClient();
      return await client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      if (!isReady) return;
      const client = await getRedisClient();
      await client.set(key, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      if (!isReady) return;
      const client = await getRedisClient();
      await client.setEx(key, seconds, value);
    } catch (error) {
      console.error('Redis SETEX error:', error);
    }
  },

  async del(key: string | string[]): Promise<void> {
    try {
      if (!isReady) return;
      const client = await getRedisClient();
      if (Array.isArray(key)) {
        await client.del(key);
      } else {
        await client.del(key);
      }
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (!isReady) return false;
      const client = await getRedisClient();
      return (await client.exists(key)) === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    try {
      if (!isReady) return 0;
      const client = await getRedisClient();
      return await client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (!isReady) return;
      const client = await getRedisClient();
      await client.expire(key, seconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  },

  // Cache helper with automatic JSON serialization
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    const json = JSON.stringify(value);
    if (ttl) {
      await this.setex(key, ttl, json);
    } else {
      await this.set(key, json);
    }
  },

  // Pattern-based deletion
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (!isReady) return;
      const client = await getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
    }
  },
};

// Session store for NextAuth
export async function getSessionStore() {
  const client = await getRedisClient();
  
  return {
    async get(sessionToken: string) {
      const session = await client.get(`session:${sessionToken}`);
      return session ? JSON.parse(session) : null;
    },
    
    async set(sessionToken: string, session: any, maxAge: number) {
      await client.setEx(`session:${sessionToken}`, maxAge, JSON.stringify(session));
    },
    
    async destroy(sessionToken: string) {
      await client.del(`session:${sessionToken}`);
    },
  };
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const window = Math.floor(now / (windowSeconds * 1000));
  const windowKey = `${key}:${window}`;
  
  const current = await redis.incr(windowKey);
  
  if (current === 1) {
    await redis.expire(windowKey, windowSeconds);
  }
  
  const resetAt = (window + 1) * windowSeconds * 1000;
  const remaining = Math.max(0, limit - current);
  
  return {
    allowed: current <= limit,
    remaining,
    resetAt,
  };
}