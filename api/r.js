// api/r.js
export default async function handler(req, res) {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const resp = await fetch(`${redisUrl}/get/links`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const data = await resp.json();

    if (!data.result) return res.status(404).send("No hay enlaces guardados");

    const urls = decodeURIComponent(data.result).split(",");
    const url = urls[Math.floor(Math.random() * urls.length)];

    return res.redirect(302, url);
  } catch (e) {
    console.error("Error en /api/r:", e);
    return res.status(500).send("Error interno del servidor");
  }
}
