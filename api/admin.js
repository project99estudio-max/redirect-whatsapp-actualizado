import fetch from "node-fetch";
const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIST_KEY = process.env.LIST_KEY || "walink:list";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "cambialo-ya";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, msg: "no autorizado" });
  if (req.method !== "POST") return res.status(400).json({ ok: false, msg: "usa POST con JSON (array)" });

  let raw = ""; for await (const c of req) raw += c;
  const arr = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  if (!Array.isArray(arr)) return res.status(400).json({ ok: false, msg: "body debe ser array" });

  const r = await fetch(`${UPSTASH_REST_URL}/command`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: ["SET", LIST_KEY, JSON.stringify(arr)] })
  });
  return res.status(200).json({ ok: true, saved: arr.length, raw: await r.json() });
}
