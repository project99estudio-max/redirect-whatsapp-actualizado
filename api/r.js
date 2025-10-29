import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function normalizeItem(s) {
  try {
    const o = JSON.parse(s);
    if (o && typeof o === 'object' && typeof o.url === 'string') {
      return { name: o.name || '', url: o.url.trim() };
    }
  } catch {}
  const str = String(s || '').trim();
  if (!str) return null;
  return { name: '', url: str };
}

async function getBlockSize() {
  const saved = await redis.get('blocksize');
  if (saved) {
    const n = Number(saved);
    if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  }
  const envN = Number(process.env.BLOCK_SIZE || 2);
  if (Number.isInteger(envN) && envN >= 1 && envN <= 50) return envN;
  return 2;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const raw = await redis.lrange('links', 0, -1);
  const list = raw.map(normalizeItem).filter(Boolean);
  if (!list.length) return res.status(404).send('No hay enlaces configurados.');

  const blockSize = await getBlockSize();

  let i = Number(await redis.get('rot:i'));
  if (!Number.isInteger(i) || i < 0) i = 0;
  let left = Number(await redis.get('rot:left'));
  if (!Number.isInteger(left) || left <= 0) left = blockSize;

  if (i >= list.length) {
    i = 0;
    left = blockSize;
  }

  const current = list[i];
  const target = current.url;

  left -= 1;
  if (left <= 0) {
    i = (i + 1) % list.length;
    left = blockSize;
  }

  await redis.set('rot:i', String(i));
  await redis.set('rot:left', String(left));

  res.writeHead(302, { Location: target });
  res.end();
}
