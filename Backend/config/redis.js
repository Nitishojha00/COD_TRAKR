const Redis = require('ioredis');
require('dotenv').config();

// Create Redis client - auto-connects immediately
const redisClient = new Redis({
    host: process.env.REDIS_USER_HOST || 'localhost',
    port: process.env.REDIS_USER_PORT || 6379,
    username: process.env.REDIS_USER_NAME || undefined,
    password: process.env.REDIS_USER_PASS || undefined,
    retryStrategy: (times) => {
        // Exponential backoff: 50ms, 100ms, 200ms... max 2000ms
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

// Event handlers (works perfectly with ioredis)
redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

module.exports = redisClient;