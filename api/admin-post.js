// /api/admin-post.js  (CommonJS - Node.js Serverless en Vercel)
module.exports = async (req, res) => {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    // 1) Token por query
    const token = (req.query && req.query.token) ? String(req.query.token) : '';
    if (!token) {
      return res.status(400).json({ ok: false, error: 'missing_token' });
    }

    // 2) Lista enviada como JSON array
    let links = [];
    try {
      // Vercel parsea JSON si el header es application/json, pero lo
      // convertimos a array limpio por las dudas
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      links = Array.isArray(body) ? body : [];
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'invalid_json_body' });
    }

    // Limpiar y filtrar vacíos
    links = links.map(v => (v || '').trim()).filter(Boolean);
    if (links.length === 0) {
      return res.status(400).json({ ok: false, error: 'empty_list' });
    }

    // 3) Construir la URL absoluta a tu propio /api/admin
    //    (usa dominio de Vercel si está, sino el host actual)
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `https://${req.headers.host}`;

    // 4) Encodear los enlaces como CSV para ?set=
    const csv = encodeURIComponent(links.join(','));

    // 5) Llamar a tu endpoint /api/admin para guardar
    const url = `${base}/api/admin?token=${encodeURIComponent(token)}&set=${csv}`;
    const r = await fetch(url, { method: 'GET' });
    const j = await r.json().catch(() => ({}));

    if (!r.ok || !j || j.ok === false) {
      return res.status(500).json({
        ok: false,
        error: 'admin_endpoint_failed',
        detail: j || null
      });
    }

    // OK
    return res.status(200).json({ ok: true, saved: links.length });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'server_error',
      message: err && err.message ? err.message : String(err)
    });
  }
};
