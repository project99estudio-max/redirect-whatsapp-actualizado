import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const { token } = req.query;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'bad_token' });
  }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
    if (!Array.isArray(body)) throw new Error('bad_body');
  } catch {
    return res.status(400).json({ ok: false, error: 'bad_body' });
  }

  const normalized = body
    .map((it) => {
      if (typeof it === 'string') return { name: '', url: it };
      if (it && typeof it === 'object') return { name: (it.name || '').trim(), url: (it.url || '').trim() };
      return null;
    })
    .filter((it) => it && it.url);

  if (normalized.length === 0) return res.status(400).json({ ok: false, error: 'empty_list' });

  await redis.del('links');
  let saved = 0;
  for (const it of normalized) {
    await redis.rpush('links', JSON.stringify(it)); // ← CLAVE
    saved++;
  }
  return res.json({ ok: true, saved });
}
