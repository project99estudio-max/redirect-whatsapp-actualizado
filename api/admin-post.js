// /api/admin-post.js (ESM)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { token } = req.query;
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'bad_token' });
    }

    // Vercel ya parsea JSON si viene con Content-Type: application/json
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'body_must_be_array' });
    }

    // Normalizar links
    const links = body.map(v => String(v || '').trim()).filter(Boolean);
    if (links.length === 0) {
      return res.status(400).json({ ok: false, error: 'empty_list' });
    }

    // Guardar: reemplaza la lista
    await redis.del('links');
    let saved = 0;
    for (const link of links) {
      await redis.rpush('links', link);
      saved++;
    }

    return res.status(200).json({ ok: true, saved });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'server_error',
      message: err?.message || String(err),
    });
  }
}
