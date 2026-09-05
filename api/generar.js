export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método no permitido"
      });
    }

    const body = req.body || {};
    const prompt = body.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "Falta el prompt"
      });
    }

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
      return res.status(500).json({
        error: data.error?.message || "Error de OpenAI"
      });
    }

    let texto = "";

    if (data.output) {
      for (const item of data.output) {
        if (item.content) {
          for (const parte of item.content) {
            if (parte.type === "output_text") {
              texto += parte.text || "";
            }
          }
        }
      }
    }

    if (!texto) {
      return res.status(500).json({
        error: "La IA no devolvió texto"
      });
    }

    return res.status(200).json({
      texto: texto
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Error del servidor"
    });
  }
}
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const contenido of item.content) {
          if (contenido.type === "output_text") {
            texto += contenido.text || "";
          }
        }
      }
    }

    texto = texto
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/[^\x20-\x7EÀ-ÿ\n\r\t¿¡]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!texto) {
      return res.status(500).json({
        error: "La IA no generó contenido"
      });
    }

    return res.status(200).json({
      texto: texto
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error interno: " + error.message
    });
  }
}
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const contenido of item.content) {
          if (contenido.type === "output_text") {
            texto += contenido.text || "";
          }
        }
      }
    }

    texto = limpiarTexto(texto);

    if (!texto) {
      return res.status(500).json({
        error: "La IA no generó contenido"
      });
    }

    return res.status(200).json({
      texto
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error interno: " + error.message
    });
  }
}

function limpiarTexto(texto) {
  return texto
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[^\x20-\x7EÀ-ÿ\n\r\t¿¡]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}      });
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
