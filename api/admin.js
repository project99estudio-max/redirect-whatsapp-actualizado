import fetch from "node-fetch";

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIST_KEY = process.env.LIST_KEY || "walink:list";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "cambialo-ya";

async function upstash(cmd) {
  const r = await fetch(`${UPSTASH_REST_URL}/command`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cmd }),
  });
  return r.json();
}

export default async function handler(req, res) {
  try {
    const token = req.headers["x-admin-token"] || req.query.token;
    if (token !== ADMIN_TOKEN)
      return res.status(401).json({ ok: false, msg: "No autorizado" });

    let links = [];

    if (req.method === "GET" && req.query.set) {
      // admite GET ?set=url1,url2,url3
      links = String(req.query.set)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (req.method === "POST") {
      let raw = "";
      for await (const c of req) raw += c;
      links = JSON.parse(raw);
      if (!Array.isArray(links))
        throw new Error("El body debe ser un array JSON");
    } else {
      return res
        .status(400)
        .json({ ok: false, msg: "usa GET ?set=... o POST JSON" });
    }

    const result = await upstash(["SET", LIST_KEY, JSON.stringify(links)]);
    return res
      .status(200)
      .json({ ok: true, saved: links.length, upstash: result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
