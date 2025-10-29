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

  // normalizar y VALIDAR que url sea string http(s)
  const normalized = [];
  for (const it of body) {
    const name = (it && typeof it === 'object' ? (it.name || '') : '').trim();
    const url  = (it && typeof it === 'object' ? it.url : (typeof it === 'string' ? it : ''));

    if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return res.status(400).json({ ok: false, error: 'bad_url', detail: url });
    }
    normalized.push({ name, url: url.trim() });
  }

  if (normalized.length === 0) return res.status(400).json({ ok: false, error: 'empty_list' });

  await redis.del('links');
  for (const it of normalized) {
    await redis.rpush('links', JSON.stringify(it));
  }
  return res.json({ ok: true, saved: normalized.length });
}
