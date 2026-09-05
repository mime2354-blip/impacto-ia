export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método no permitido"
      });
    }

    const body = req.body || {};

    const tema = body.tema || "animales";
    const tipo = body.tipo || "Actividades infantiles";
    const edad = body.edad || "5-7 años";
    const paginas = body.paginas || "20";
    const estilo = body.estilo || "Divertido";
    const extra = body.extra || "";

    const prompt = `
Crea un cuadernillo infantil de ${paginas} páginas.

Tema: ${tema}
Tipo: ${tipo}
Edad: ${edad}
Estilo: ${estilo}
Instrucciones adicionales: ${extra}

IMPORTANTE:
- Crea contenido para todas las páginas.
- Numera cada página.
- Cada página debe tener una actividad clara.
- Usa lenguaje adecuado para niños.
- No uses Markdown.
- No uses símbolos como ## o **.
- Devuelve únicamente el contenido del cuadernillo.
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

    console.log("OPENAI STATUS:", response.status);
    console.log("OPENAI DATA:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "Error de OpenAI"
      });
    }

    let texto = "";

    if (data.output_text) {
      texto = data.output_text;
    }

    if (!texto && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const contenido of item.content) {
            if (contenido.text) {
              texto += contenido.text + "\n";
            }
          }
        }
      }
    }

    if (!texto.trim()) {
      return res.status(500).json({
        error: "OpenAI no devolvió contenido"
      });
    }

    return res.status(200).json({
      texto: texto.trim()
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.status(500).json({
      error: error.message || "Error interno"
    });
  }
}
