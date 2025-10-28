import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const { token } = req.query;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'bad_token' });
  }

  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: 'body_must_be_array' });
  }

  await redis.del('links');
  let saved = 0;
  for (const l of body) {
    if (typeof l === 'string' && l.trim()) {
      await redis.rpush('links', l.trim());
      saved++;
    }
  }
  return res.status(200).json({ ok: true, saved });
}
