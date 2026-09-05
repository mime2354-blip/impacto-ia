export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: "Simple black and white coloring book drawing of a happy puppy, clean thick outlines, white background, no text.",
          size: "1024x1024"
        })
      }
    );

    const data = await response.json();

    console.log("IMAGE TEST:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "Error generando imagen"
      });
    }

    return res.status(200).json({
      ok: true,
      imagen: data.data?.[0]?.b64_json || data.data?.[0]?.url || null
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
