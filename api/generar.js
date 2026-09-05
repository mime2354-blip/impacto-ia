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
    const paginas = Number(body.paginas) || 20;
    const estilo = body.estilo || "Divertido";
    const extra = body.extra || "";

    const prompt = `
Crea un cuadernillo infantil de ${paginas} páginas.

Tema: ${tema}
Tipo: ${tipo}
Edad: ${edad}
Estilo: ${estilo}
Instrucciones: ${extra}

Para CADA página crea:
- Título
- Instrucciones de la actividad
- Una descripción breve del dibujo que debe aparecer en esa página.

Usa este formato EXACTO:

PÁGINA 1
TÍTULO: ...
ACTIVIDAD: ...
DIBUJO: ...

PÁGINA 2
TÍTULO: ...
ACTIVIDAD: ...
DIBUJO: ...

Continúa hasta la página ${paginas}.

No uses Markdown.
`;

    // 1. Generar el contenido
    const textResponse = await fetch(
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

    const textData = await textResponse.json();

    if (!textResponse.ok) {
      console.log("TEXT ERROR:", JSON.stringify(textData));

      return res.status(500).json({
        error: textData.error?.message || "Error generando el contenido"
      });
    }

    let texto = textData.output_text || "";

    if (!texto && Array.isArray(textData.output)) {
      for (const item of textData.output) {
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

    // 2. Extraer las descripciones de dibujos
    const dibujos = [];

    const bloques = texto.split(/PÁGINA\s+\d+/i);

    for (const bloque of bloques) {
      const coincidencia = bloque.match(
        /DIBUJO:\s*([\s\S]*?)(?=\nPÁGINA|\s*$)/i
      );

      if (coincidencia) {
        dibujos.push(coincidencia[1].trim());
      }
    }

    // 3. Generar imágenes
    const imagenes = [];

    for (let i = 0; i < dibujos.length; i++) {

      const descripcion = dibujos[i];

      if (!descripcion) continue;

      const imageResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY
          },
          body: JSON.stringify({
            model: "gpt-image-2",
            prompt:
              `Black and white children's coloring book illustration.
              Simple clean line art.
              White background.
              No text.
              Easy shapes for children aged ${edad}.
              Theme: ${tema}.
              Illustration: ${descripcion}`,
            size: "1024x1024"
          })
        }
      );

      const imageData = await imageResponse.json();

      console.log(
        "IMAGE",
        i + 1,
        JSON.stringify(imageData)
      );

      if (!imageResponse.ok) {
        console.log("IMAGE ERROR:", JSON.stringify(imageData));
        continue;
      }

      if (
        imageData.data &&
        imageData.data[0]
      ) {
        if (imageData.data[0].b64_json) {
          imagenes.push({
            pagina: i + 1,
            imagen: imageData.data[0].b64_json
          });
        } else if (imageData.data[0].url) {
          imagenes.push({
            pagina: i + 1,
            imagen: imageData.data[0].url
          });
        }
      }
    }

    return res.status(200).json({
      texto: texto.trim(),
      imagenes: imagenes
    });

  } catch (error) {

    console.log("ERROR:", error);

    return res.status(500).json({
      error: error.message || "Error interno"
    });
  }
}
