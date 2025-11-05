import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { token, url } = req.query;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'bad_token' });
  }

  if (!url) return res.status(400).json({ ok: false, error: 'missing_url' });

  try {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    await redis.hincrby(`stats:redirect:day:${day}`, decodeURIComponent(url), 1);
    await redis.expire(`stats:redirect:day:${day}`, 35 * 24 * 60 * 60);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/stats-redirect', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
