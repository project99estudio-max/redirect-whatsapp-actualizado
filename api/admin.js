export default async function handler(req, res) {
  const { token, set } = req.query;

  // Validar token
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    // Validar que haya URLs en "set"
    if (!set) {
      return res.status(400).json({ error: 'Falta el parámetro set' });
    }

    // Guardar temporalmente en Redis
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const response = await fetch(`${redisUrl}/set/links/${encodeURIComponent(set)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (!response.ok) throw new Error("Error al guardar en Redis");

    return res.status(200).json({ ok: true, saved: set.split(",").length });
  } catch (err) {
    console.error("Error en /api/admin:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
