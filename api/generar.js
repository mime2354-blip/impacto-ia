export default function handler(req, res) {
  res.status(200).send("FUNCION API OK");
}
    return res.status(500).json({
      error: error.message || "Error interno del servidor"
    });
  }
}
