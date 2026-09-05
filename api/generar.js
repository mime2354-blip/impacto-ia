export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({
        error: "Falta el tema del cuadernillo"
      });
    }

    const respuesta = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({
        error: data?.error?.message || "Error de OpenAI"
      });
    }

    let texto = "";

    if (data.output) {
      for (const item of data.output) {
        if (item.content) {
          for (const contenido of item.content) {
            if (contenido.type === "output_text") {
              texto += contenido.text || "";
            }
          }
        }
      }
    }

    if (!texto) {
      return res.status(500).json({
        error: "La IA no devolvió ningún contenido"
      });
    }

    return res.status(200).json({
      texto: texto
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno del servidor"
    });
  }
}
