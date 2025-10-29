import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_IDX = 'links:index';
const KEY_LIST = 'links';
const BLOCK = parseInt(process.env.BLOCK_SIZE || '2', 10);

export default async function handler(req, res) {
  try {
    // Obtener lista
    const raw = await redis.lrange(KEY_LIST, 0, -1);
    if (!raw || raw.length === 0) {
      return res.status(404).json({ ok: false, error: 'no_links' });
    }

    // índice actual y bloqueo de 2 clics por número
    let idx = parseInt((await redis.get(KEY_IDX)) || '0', 10);
    if (isNaN(idx) || idx < 0) idx = 0;

    const pointer = Math.floor(idx / BLOCK) % raw.length;
    const itemRaw = raw[pointer];

    // Parsear item → {name,url} o string-compat
    let url = '';
    try {
      const obj = JSON.parse(itemRaw);
      url = obj && obj.url ? obj.url : String(itemRaw);
    } catch {
      url = String(itemRaw);
    }

    // incrementar índice
    await redis.incr(KEY_IDX);

    // redirigir
    res.writeHead(302, { Location: url });
    return res.end();
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
