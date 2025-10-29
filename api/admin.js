// /api/admin.js
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

  const { token, get, reset, set } = req.query;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'bad_token' });
  }

  // Reset lista
  if (reset) {
    await redis.del('links');
    return res.json({ ok: true, reset: true });
  }

  // Compat: set via query guarda ya como objeto serializado
  if (set) {
    const arr = decodeURIComponent(set)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    await redis.del('links');
    for (const url of arr) {
      await redis.rpush('links', JSON.stringify({ name: '', url }));
    }
    return res.json({ ok: true, saved: arr.length });
  }

  if (get) {
    const raw = await redis.lrange('links', 0, -1);
    const links = raw.map((s) => {
      try {
        const o = JSON.parse(s);
        if (o && o.url) return { name: o.name || '', url: o.url };
        return { name: '', url: String(s) };
      } catch {
        return { name: '', url: String(s) }; // compat strings viejos
      }
    });
    return res.json({ ok: true, links });
  }

  return res.status(400).json({ ok: false, error: 'missing_action' });
}
