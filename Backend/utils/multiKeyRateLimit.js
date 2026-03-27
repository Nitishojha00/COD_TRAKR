const crypto = require('crypto');

const MULTI_KEY_LUA = `
  local emailKey = KEYS[1]
  local ipKey = KEYS[2]
  local globalKey = KEYS[3]

  local emailLimit = tonumber(ARGV[1])
  local ipLimit = tonumber(ARGV[2])
  local globalLimit = tonumber(ARGV[3])
  
  local emailWindow = tonumber(ARGV[4])
  local ipWindow = tonumber(ARGV[5])
  local globalWindow = tonumber(ARGV[6])
  local uniqueId = ARGV[7]

  local time = redis.call('TIME')
  local now = time[1] * 1000 + math.floor(time[2] / 1000)

  -- 🔥 FIX: seed random
  math.randomseed(now)

  local emailStart = now - (emailWindow * 1000)
  local ipStart = now - (ipWindow * 1000)
  local globalStart = now - (globalWindow * 1000)

  redis.call('ZREMRANGEBYSCORE', emailKey, '-inf', emailStart)
  redis.call('ZREMRANGEBYSCORE', ipKey, '-inf', ipStart)
  redis.call('ZREMRANGEBYSCORE', globalKey, '-inf', globalStart)

  local emailCount = redis.call('ZCARD', emailKey)
  local ipCount = redis.call('ZCARD', ipKey)
  local globalCount = redis.call('ZCARD', globalKey)

  if emailCount >= emailLimit then
    local oldest = redis.call('ZRANGE', emailKey, 0, 0, 'WITHSCORES')
    local retryMs = emailWindow * 1000
    if oldest and oldest[2] then
      retryMs = (tonumber(oldest[2]) + (emailWindow * 1000)) - now
    end
    return {0, 0, "EMAIL_LIMIT", math.max(0, retryMs)}
  end

  if ipCount >= ipLimit then
    local oldest = redis.call('ZRANGE', ipKey, 0, 0, 'WITHSCORES')
    local retryMs = ipWindow * 1000
    if oldest and oldest[2] then
      retryMs = (tonumber(oldest[2]) + (ipWindow * 1000)) - now
    end
    return {0, 0, "IP_LIMIT", math.max(0, retryMs)}
  end

  if globalCount >= globalLimit then
    local oldest = redis.call('ZRANGE', globalKey, 0, 0, 'WITHSCORES')
    local retryMs = globalWindow * 1000
    if oldest and oldest[2] then
      retryMs = (tonumber(oldest[2]) + (globalWindow * 1000)) - now
    end
    return {0, 0, "GLOBAL_LIMIT", math.max(0, retryMs)}
  end

  local member = now .. '-' .. uniqueId .. '-' .. math.random()

  redis.call('ZADD', emailKey, now, member)
  redis.call('ZADD', ipKey, now, member)
  redis.call('ZADD', globalKey, now, member)

  if redis.call('TTL', emailKey) == -1 then
    redis.call('EXPIRE', emailKey, emailWindow + 5)
  end

  if redis.call('TTL', ipKey) == -1 then
    redis.call('EXPIRE', ipKey, ipWindow + 5)
  end

  if redis.call('TTL', globalKey) == -1 then
    redis.call('EXPIRE', globalKey, globalWindow + 5)
  end

  local remaining = emailLimit - (emailCount + 1)
  if remaining < 0 then remaining = 0 end

  return {1, remaining, "", 0}
`;

const multiKeyRateLimit = async (redis, options) => {
  try {
    const {
      email,
      ip,
      emailLimit,
      ipLimit,
      globalLimit,
      emailWindow,
      ipWindow,
      globalWindow,
      prefix
    } = options;

    const requestId = crypto.randomUUID();

    const result = await redis.eval(
      MULTI_KEY_LUA,
      3,
      `rl:${prefix}:email:${email}`,
      `rl:${prefix}:ip:${ip}`,
      `rl:${prefix}:global`,
      String(emailLimit),
      String(ipLimit),
      String(globalLimit),
      String(emailWindow),
      String(ipWindow),
      String(globalWindow),
      requestId
    );

    const isAllowed = Number(result[0]) === 1;

    return {
      allowed: isAllowed,
      remaining: Number(result[1] || 0),
      reason: result[2] || null,
      retryAfterMs: Number(result[3] || 0)
    };

  } catch (err) {
    console.error("[RateLimiter Error]:", err);

    return {
      allowed: false,
      remaining: 0,
      reason: "RATE_LIMIT_ERROR",
      retryAfterMs: 1000
    };
  }
};

module.exports = multiKeyRateLimit;