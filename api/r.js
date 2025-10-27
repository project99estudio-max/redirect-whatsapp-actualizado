import fetch from "node-fetch";

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIST_KEY = process.env.LIST_KEY || "walink:list";
const COUNTER_KEY = process.env.COUNTER_KEY || "walink:counter";
const BLOCK_SIZE = Number(process.env.BLOCK_SIZE || 2);

async function upstash(cmd) {
  const res = await fetch(`${UPSTASH_REST_URL}/command`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_REST_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cmd })
  });
  return (await res.json()).result;
}

export default async function handler(req, res) {
  try {
    const listRaw = await upstash(["GET", LIST_KEY]);
    const links = listRaw ? JSON.parse(listRaw) : [];
    if (!Array.isArray(links) || links.length === 0) {
      res.writeHead(302, { Location: "https://walink.co" }); return res.end();
    }
    const c = Number(await upstash(["INCR", COUNTER_KEY]));
    const idx = Math.floor((c - 1) / BLOCK_SIZE) % links.length;

    const base = String(links[idx]).trim();
    const url = new URL(req.url, `https://${req.headers.host}`);
    const destino = base + (url.search || "");
    res.writeHead(302, { Location: destino }); res.end();
  } catch {
    res.writeHead(302, { Location: "https://walink.co" }); res.end();
  }
}
