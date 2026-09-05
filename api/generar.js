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
        error: "Falta el prompt"
      });
    }

    const respuesta = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY
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

    if (typeof data.output_text === "string") {
      texto = data.output_text;
    }

    if (!texto && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const parte of item.content) {
          if (typeof parte.text === "string") {
            texto += parte.text;
          }
        }
      }
    }

    if (!texto) {
      return res.status(500).json({
        error: "OpenAI respondió, pero no encontramos el texto generado."
      });
    }

    return res.status(200).json({
      texto: texto.trim()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error del servidor: " + error.message
    });
  }
}
