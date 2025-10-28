// api/admin.js
export default async function handler(req, res) {
  try {
    const { token, set, get, reset } = req.query;
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "token inválido" });
    }

    const base = process.env.UPSTASH_REDIS_REST_URL;
    const auth = { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` };

    // RESET: borra la lista (key "links")
    if (reset) {
      const r = await fetch(`${base}/del/links`, { method: "POST", headers: auth });
      const j = await r.json();
      return res.json({ ok: true, reset: true, upstash: j });
    }

    // GET: devuelve la lista guardada como array
    if (get) {
      const r = await fetch(`${base}/get/links`, { headers: auth });
      const j = await r.json();
      const csv = j.result || "";
      const arr = csv ? decodeURIComponent(csv).split(",").map(s => s.trim()).filter(Boolean) : [];
      return res.json({ ok: true, links: arr });
    }

    // SET: guarda CSV en "links"
    if (set) {
      const r = await fetch(`${base}/set/links/${encodeURIComponent(set)}`, {
        method: "POST",
        headers: auth
      });
      const j = await r.json();
      const count = set.split(",").filter(Boolean).length;
      return res.json({ ok: true, saved: count, upstash: j });
    }

    return res.status(400).json({ ok: false, error: "usa ?set=..., ?get=1 o ?reset=1" });
  } catch (e) {
    console.error("admin error:", e);
    return res.status(500).json({ ok: false, error: "error interno" });
  }
}
