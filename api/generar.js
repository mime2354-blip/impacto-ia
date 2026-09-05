export default async function handler(req, res) {
  return res.status(200).json({
    texto: "PRUEBA IMPACTO IA FUNCIONANDO"
  });
}      });
    }

    let texto = "";

    // Método 1
    if (data.output_text) {
      texto = data.output_text;
    }

    // Método 2
    if (!texto && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const parte of item.content) {
          if (parte.type === "output_text" && parte.text) {
            texto += parte.text;
          }
        }
      }
    }

    // Método 3
    if (!texto && Array.isArray(data.output)) {
      texto = data.output
        .map(item => {
          if (!Array.isArray(item.content)) return "";

          return item.content
            .map(parte => parte.text || "")
            .join("");
        })
        .join("");
    }

    if (!texto.trim()) {
      console.log("RESPUESTA OPENAI:", JSON.stringify(data));

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
