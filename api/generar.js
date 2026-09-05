export default async function handler(req, res) {
  return res.status(200).json({
    texto: "RECIBIDO: " + JSON.stringify(req.body)
  });
}        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("ERROR OPENAI:", JSON.stringify(data));
      return res.status(500).json({
        error: data.error?.message || "Error al conectar con OpenAI"
      });
    }

    const texto = data.output_text || "";

    if (!texto.trim()) {
      console.log("RESPUESTA OPENAI:", JSON.stringify(data));
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
      error: error.message || "Error interno del servidor"
    });
  }
}
