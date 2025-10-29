// /api/r.js  (ESM) — redirección con rotación por bloque
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 1) Traer links
    const links = await redis.lrange('links', 0, -1);
    if (!links || links.length === 0) {
      return res.status(200).send('Sin enlaces configurados.');
    }

    // 2) Block size: Redis > ENV > 2
    let bs = await redis.get('blockSize');
    bs = Number(bs ?? process.env.BLOCK_SIZE ?? 2);
    if (!Number.isInteger(bs) || bs < 1) bs = 2;

    // 3) Estado de rotación
    let idx = Number(await redis.get('rotateIndex') ?? 0);
    let hit = Number(await redis.get('rotateCount') ?? 0);
    if (!Number.isInteger(idx) || idx < 0) idx = 0;
    if (!Number.isInteger(hit) || hit < 0) hit = 0;

    // 4) Elegir link actual y actualizar contadores
    let nextIdx = idx, nextHit = hit + 1;
    if (nextHit >= bs) { nextIdx = (idx + 1) % links.length; nextHit = 0; }

    // Persistir nuevos contadores (no bloquear)
    await Promise.all([
      redis.set('rotateIndex', nextIdx),
      redis.set('rotateCount', nextHit),
    ]);

    const url = links[idx];
    // 5) Redirigir
    res.statusCode = 302;
    res.setHeader('Location', url);
    return res.end();
  } catch (e) {
    return res.status(500).send('Error interno');
  }
}
