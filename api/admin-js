// api/admin.js
export default async function handler(req, res) {
  try {
    const { token, set, get, reset } = req.query;
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "token inválido" });
    }

    const base = process.env.UPSTASH_REDIS_REST_URL;
    const auth = { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` };

    // RESET: borra la lista
    if (reset) {
      const r = await fetch(`${base}/del/links`, { method: "POST", headers: auth });
      const j = await r.json();
      return res.json({ ok: true, reset: true, upstash: j });
    }

    // GET: devuelve array limpio
    if (get) {
      const r = await fetch(`${base}/get/links`, { headers: auth });
      const j = await r.json();
      const csv = j.result || "";
      const arr = csv
        ? decodeURIComponent(csv).split(/,(?=https?:\/\/)/).map(s => s.trim()).filter(Boolean)
        : [];
      return res.json({ ok: true, links: arr });
    }

    // SET: acepta CSV y separa SOLO comas que preceden a http/https (evita falsos positivos)
    if (set) {
      const raw = decodeURIComponent(set);
      let arr = raw
        .split(/,(?=https?:\/\/)/)          // split seguro
        .map(s => s.trim())
        .filter(u => /^https?:\/\/wa\.me\/\d+/.test(u)); // válidos

      // dedup
      arr = Array.from(new Set(arr));

      const csv = encodeURIComponent(arr.join(","));
      const r = await fetch(`${base}/set/links/${csv}`, { method: "POST", headers: auth });
      const j = await r.json();
      return res.json({ ok: true, saved: arr.length, upstash: j });
    }

    return res.status(400).json({ ok: false, error: "usa ?set=..., ?get=1 o ?reset=1" });
  } catch (e) {
    console.error("admin error:", e);
    return res.status(500).json({ ok: false, error: "error interno" });
  }
}
