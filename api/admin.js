// api/admin.js
// Uso: /api/admin?token=TU_TOKEN&set=url1,url2,url3
export default async function handler(req, res) {
  try {
    const { token, set } = req.query;

    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "token inválido" });
    }

    if (!set) {
      return res.status(400).json({ ok: false, error: "falta parámetro ?set=" });
    }

    // Guardamos los links en la key "links"
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const setResp = await fetch(`${redisUrl}/set/links/${encodeURIComponent(set)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const setData = await setResp.json();

    // Contador de cuántos guardaste (para feedback)
    const saved = set.split(",").length;

    return res.json({ ok: true, saved, upstash: setData });
  } catch (e) {
    console.error("Error en /api/admin:", e);
    return res.status(500).json({ ok: false, error: "error interno" });
  }
}
