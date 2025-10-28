// api/admin.js
export default async function handler(req, res) {
  try {
    const { token, set, get, reset } = req.query;
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "token inválido" });
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // RESET: borra la lista (clave "links")
    if (reset) {
      const r = await fetch(`${redisUrl}/command`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: ["DEL", "links"] }),
      });
      const j = await r.json();
      return res.json({ ok: true, reset: true, upstash: j });
    }

    // GET: devuelve la lista guardada como array
    if (get) {
      const r = await fetch(`${redisUrl}/command`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: ["GET", "links"] }),
      });
      const j = await r.json();
      const csv = j.result || "";
      const arr = csv ? decodeURIComponent(csv).split(",").map(s => s.trim()).filter(Boolean) : [];
      return res.json({ ok: true, links: arr });
    }

    // SET: guarda lista (CSV) en "links"
    if (set) {
      const value = set; // ya viene CSV en la query
      const r = await fetch(`${redisUrl}/command`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: ["SET", "links", value] }),
      });
      const j = await r.json();
      const count = value.split(",").filter(Boolean).length;
      return res.json({ ok: true, saved: count, upstash: j });
    }

    return res.status(400).json({ ok: false, error: "usa ?set=..., ?get=1 o ?reset=1" });
  } catch (e) {
    console.error("admin error:", e);
    return res.status(500).json({ ok: false, error: "error interno" });
  }
}
