// rateLimiter.js

// 🔥 Ye Lua script Redis ke andar run hoti hai (atomic execution)
// Matlab ek hi baar me sab kaam hoga → race condition nahi hogi
const SLIDING_WINDOW_LUA = `
  local key = KEYS[1]
  local windowSeconds = tonumber(ARGV[1])   -- kitne seconds ka window
  local limit = tonumber(ARGV[2])           -- max allowed requests

  -- 🕒 Redis ka current time le rahe hai (server time, safe hai)
  local time = redis.call('TIME')
  local now = time[1] * 1000 + math.floor(time[2] / 1000)

  -- 🪟 window ka start (abhi se peeche ka time)
  local windowStart = now - (windowSeconds * 1000)

  -- 🧹 purane requests hatao (jo window ke bahar hai)
  redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

  -- 📊 abhi kitne requests hai window me
  local currentCount = redis.call('ZCARD', key)

  -- ❌ agar limit cross ho gayi
  if currentCount >= limit then

    -- 🧠 oldest request nikaalo (retry calculate karne ke liye)
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')

    -- default retry time
    local retryAfterMs = windowSeconds * 1000

    if oldest and oldest[2] then
      local oldestTimestamp = tonumber(oldest[2])

      -- ⏳ kab tak wait karna hai (jab oldest window se bahar ho jaye)
      retryAfterMs = (oldestTimestamp + (windowSeconds * 1000)) - now
    end

    -- return:
    -- 0 = blocked
    -- 0 = remaining
    -- retry time
    return { 0, 0, math.max(0, retryAfterMs) }
  end

  -- ✅ unique member bana rahe hai (timestamp + count)
  -- Lua atomic hai, isliye currentCount safe hai
  local member = now .. '-' .. currentCount

  -- ➕ current request add karo sorted set me
  redis.call('ZADD', key, now, member)

  -- 🔁 TTL slide karo (har request pe update)
  -- taaki window sahi se move kare
  redis.call('EXPIRE', key, windowSeconds)

  -- return:
  -- 1 = allowed
  -- remaining requests
  -- retryAfter = 0 (kyunki allowed hai)
  return { 1, limit - (currentCount + 1), 0 }
`;

/**
 * 🔥 Sliding Window Rate Limiter Function
 * Ye JS function Lua script ko call karta hai
 */
const slidingWindowRateLimit = async (redis, { key, limit, windowSeconds }) => {

  // 🔑 Redis key bana rahe hai (short rakhna best practice hai)
  const redisKey = `rl:${key}`;

  try {
    // 🧠 Lua script run kar rahe hai Redis ke andar
    const result = await redis.eval(
      SLIDING_WINDOW_LUA,
      1,                     // kitni keys pass kar rahe hai
      redisKey,              // key
      windowSeconds.toString(),
      limit.toString()
    );

    // 📦 result decode kar rahe hai
    return {
      allowed: result[0] === 1,        // 1 → allowed, 0 → blocked
      remaining: Number(result[1]),   // kitni requests bachi hai
      retryAfterMs: Number(result[2]) // kab retry kar sakte ho
    };

  } catch (error) {
    // ⚠️ agar Redis fail ho gaya
    console.error(`[RateLimiter Error] key=${key}`, error);

    // ✅ Fail-open (API ko band nahi karte)
    return {
      allowed: true,
      remaining: 1,
      retryAfterMs: 0
    };
  }
};

module.exports = { slidingWindowRateLimit };