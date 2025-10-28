// api/r.js — rotación por bloques (2 clics por número)
export default async function handler(req, res) {
  try {
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const auth = { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` };

    // 1) Leer la lista CSV desde la key "links"
    const getResp = await fetch(`${base}/get/links`, { headers: auth });
    const getJson = await getResp.json();
    const csv = getJson.result || "";
    const links = csv
      ? decodeURIComponent(csv)
          .split(/,(?=https?:\/\/)/)   // separa solo donde empieza otra URL
          .map(s => s.trim())
          .filter(Boolean)
      : [];

    if (!links.length) {
      res.status(204).send("Sin links configurados");
      return;
    }

    // 2) Bloques estrictos: cada número recibe N clics antes de rotar
    const BLOCK_SIZE = Math.max(parseInt(process.env.BLOCK_SIZE || "2", 10), 1);

    // contador global (persistente en Redis)
    const incResp = await fetch(`${base}/incr/links:ctr`, { method: "POST", headers: auth });
    const incJson = await incResp.json();
    const counter = Number(incJson.result || 1);

    // índice por bloques: 1..N -> idx 0; N+1..2N -> idx 1; etc.
    const idx = Math.floor((counter - 1) / BLOCK_SIZE) % links.length;
    const target = links[idx];

    res.writeHead(302, { Location: target, "Cache-Control": "no-store" });
    res.end();
  } catch (e) {
    console.error("r.js error:", e);
    res.status(500).send("Error interno");
  }
}
