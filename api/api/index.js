export default async function handler(req, res) {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Leer los links guardados desde Redis
    const response = await fetch(`${redisUrl}/get/links`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    const data = await response.json();

    if (!data.result) {
      return res.status(404).send("No hay enlaces guardados");
    }

    // Separar las URLs guardadas
    const urls = decodeURIComponent(data.result).split(",");

    // Elegir una al azar
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];

    // Redirigir al enlace elegido
    return res.redirect(302, randomUrl);
  } catch (err) {
    console.error("Error en la redirección:", err);
    return res.status(500).send("Error interno del servidor");
  }
}
