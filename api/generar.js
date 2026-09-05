module.exports = (req, res) => {
  res.status(200).json({
    texto: "PRUEBA IMPACTO IA FUNCIONANDO"
  });
};        })
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
