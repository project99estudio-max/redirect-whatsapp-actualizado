import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Helper: parsea cada item de Redis a { name, url }
function normalizeItem(s) {
  // Si viene en JSON (nuevo formato)
  try {
    const o = JSON.parse(s);
    if (o && typeof o === 'object') {
      const name = typeof o.name === 'string' ? o.name : '';
      const url  = typeof o.url  === 'string' ? o.url  : '';
      if (url) return { name, url };
    }
  } catch (_) { /* no-json, sigo */ }

  // Compat con datos viejos: era un string con la URL
  const str = String(s || '').trim();
  if (!str) return null;
  return { name: '', url: str };
}

async function getBlockSize() {
  // 1) valor guardado vía /api/blocksize
  const saved = await redis.get('blocksize');
  if (saved) {
    const n = Number(saved);
    if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  }
  // 2) variable de entorno
  const envN = Number(process.env.BLOCK_SIZE || 2);
  if (Number.isInteger(envN) && envN >= 1 && envN <= 50) return envN;
  // 3) default
  return 2;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  // Traer lista
  const raw = await redis.lrange('links', 0, -1);
  const list = raw.map(normalizeItem).filter(Boolean);

  if (!list.length) {
    // No hay links: 404 amigable
    return res.status(404).send('No hay enlaces configurados.');
  }

  // Tamaño del bloque (cuántos clics por número antes de rotar)
  const blockSize = await getBlockSize();

  // Estado de rotación
  let i = Number(await redis.get('rot:i'));
  if (!Number.isInteger(i) || i < 0) i = 0;

  let left = Number(await redis.get('rot:left'));
  if (!Number.isInteger(left) || left <= 0) left = blockSize;

  // Si el índice quedó fuera por cambios de longitud, lo normalizamos
  if (i >= list.length) {
    i = 0;
    left = blockSize;
  }

  // Elegimos la URL actual
  const current = list[i];
  const target = current.url;

  // Consumimos un clic del bloque
  left -= 1;
  if (left <= 0) {
    i = (i + 1) % list.length; // siguiente cajera
    left = blockSize;          // reseteamos contador
  }

  // Persistimos estado de rotación
  await redis.mset({ 'rot:i': String(i), 'rot:left': String(left) });

  // Redirigimos
  res.writeHead(302, { Location: target });
  res.end();
}
