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

    // 1. Generar el contenido del cuadernillo
    const respuestaTexto = await fetch(
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

    const dataTexto = await respuestaTexto.json();

    if (!respuestaTexto.ok) {
      return res.status(respuestaTexto.status).json({
        error: dataTexto?.error?.message || "Error de OpenAI"
      });
    }

    let texto = dataTexto.output_text || "";

    if (!texto && Array.isArray(dataTexto.output)) {
      for (const item of dataTexto.output) {
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
        error: "No se pudo obtener el texto."
      });
    }

    // 2. Buscar la primera descripción de dibujo
    const coincidencia = texto.match(
      /\[DIBUJO:\s*([^\]]+)\]/i
    );

    const descripcion = coincidencia
      ? coincidencia[1]
      : "Ilustración infantil educativa relacionada con el tema del cuadernillo";

    // 3. Generar una imagen real
    const respuestaImagen = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input:
            "Genera una ilustración infantil educativa para un cuadernillo. " +
            "Descripción: " +
            descripcion +
            ". Fondo blanco, dibujo limpio, alegre, apropiado para niños, " +
            "sin texto ni letras dentro de la imagen.",
          tools: [
            {
              type: "image_generation"
            }
          ]
        })
      }
    );

    const dataImagen = await respuestaImagen.json();

    if (!respuestaImagen.ok) {
      return res.status(respuestaImagen.status).json({
        error: dataImagen?.error?.message || "Error generando la imagen"
      });
    }

    let imagen = null;

    if (Array.isArray(dataImagen.output)) {
      for (const item of dataImagen.output) {
        if (
          item.type === "image_generation_call" &&
          item.result
        ) {
          imagen = item.result;
          break;
        }
      }
    }

    return res.status(200).json({
      texto: texto.trim(),
      imagen: imagen
        ? "data:image/png;base64," + imagen
        : null
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error del servidor: " + error.message
    });
  }
}      });
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
