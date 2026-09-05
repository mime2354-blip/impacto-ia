export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método no permitido"
      });
    }

    const { tipo, tema, edad, paginas, estilo, extra } = req.body || {};

    if (!tema) {
      return res.status(400).json({
        error: "Escribe un tema"
      });
    }

    const prompt = `
Crea un cuadernillo infantil completo.

Tipo: ${tipo || "Actividades infantiles"}
Tema: ${tema}
Edad: ${edad || "5-7 años"}
Páginas: ${paginas || 20}
Estilo: ${estilo || "Divertido"}
Instrucciones: ${extra || "Ninguna"}

Crea contenido para todas las páginas.
Numera cada página.
Haz actividades adecuadas para la edad.
Devuelve solamente el contenido del cuadernillo.
No uses Markdown.
`;

    const response = await fetch(
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

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", JSON.stringify(data));

      return res.status(500).json({
        error: data.error?.message || "Error de OpenAI"
      });
    }

    const texto = data.output_text || "";

    if (!texto.trim()) {
      return res.status(500).json({
        error: "OpenAI no devolvió contenido"
      });
    }

    return res.status(200).json({
      texto: texto
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.status(500).json({
      error: error.message || "Error interno"
    });
  }
}
