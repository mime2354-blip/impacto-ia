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
    const edad = body.edad || "5-7 anos";
    const paginas = Number(body.paginas) || 20;
    const estilo = body.estilo || "Divertido";
    const extra = body.extra || "";

    const prompt = `
Crea un cuadernillo infantil de ${paginas} paginas.

Tema: ${tema}
Tipo: ${tipo}
Edad: ${edad}
Estilo: ${estilo}
Instrucciones: ${extra}

Para CADA pagina crea:

PAGINA 1
TITULO: ...
ACTIVIDAD: ...
DIBUJO: ...

PAGINA 2
TITULO: ...
ACTIVIDAD: ...
DIBUJO: ...

Continua hasta la pagina ${paginas}.

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
      return res.status(500).json({
        error: data.error?.message || "Error de OpenAI"
      });
    }

    let texto = data.output_text || "";

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

    const pdf = crearPDF(texto, paginas);

    return res.status(200).json({
      texto: texto.trim(),
      download: "data:application/pdf;base64," + pdf
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.status(500).json({
      error: error.message || "Error interno"
    });
  }
}


/* =========================
   CREAR PDF
========================= */

function crearPDF(texto, paginas) {

  const paginasTexto =
    texto.split(/P[ÁA]GINA\s+\d+/i)
      .filter(x => x.trim());

  const objetos = [];

  objetos.push(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
  );

  const pageIds = [];

  for (let i = 0; i < paginasTexto.length; i++) {
    pageIds.push(3 + i * 2);
  }

  const pagesKids =
    pageIds.map(id => `${id} 0 R`).join(" ");

  objetos.push(
    `2 0 obj
<<
/Type /Pages
/Count ${paginasTexto.length}
/Kids [${pagesKids}]
>>
endobj
`
  );

  let siguienteId = 3;

  for (let i = 0; i < paginasTexto.length; i++) {

    const pageId = siguienteId++;
    const contentId = siguienteId++;

    const contenido =
      limpiarTexto(paginasTexto[i]);

    const lineas =
      prepararLineas(contenido, 75);

    let stream =
      "BT\n" +
      "/F1 16 Tf\n" +
      "50 780 Td\n";

    let primera = true;

    for (const linea of lineas) {

      if (!primera) {
        stream += "0 -20 Td\n";
      }

      stream +=
        `(${escaparPDF(linea)}) Tj\n`;

      primera = false;
    }

    stream += "ET";

    const pageObject =
`/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources <<
/Font <<
/F1 ${objetos.length + 1} 0 R
>>
>>
/Contents ${contentId} 0 R`;

    objetos.push(
`${pageId} 0 obj
<<
${pageObject}
>>
endobj
`
    );

    objetos.push(
`${contentId} 0 obj
<<
/Length ${stream.length}
>>
stream
${stream}
endstream
endobj
`
    );
  }

  const fontId =
    3 + paginasTexto.length * 2;

  objetos.push(
`${fontId} 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
`
  );

  let pdf =
    "%PDF-1.4\n";

  const offsets = [0];

  for (const objeto of objetos) {

    offsets.push(
      Buffer.byteLength(pdf, "binary")
    );

    pdf += objeto;
  }

  const xref =
    Buffer.byteLength(pdf, "binary");

  pdf +=
`xref
0 ${objetos.length + 1}
0000000000 65535 f 
`;

  for (let i = 1; i < offsets.length; i++) {

    pdf +=
      String(offsets[i]).padStart(10, "0") +
      " 00000 n \n";
  }

  pdf +=
`trailer
<<
/Size ${objetos.length + 1}
/Root 1 0 R
>>
startxref
${xref}
%%EOF`;

  return Buffer.from(pdf, "binary").toString("base64");
}


/* =========================
   LIMPIAR TEXTO
========================= */

function limpiarTexto(texto) {

  return texto
    .replace(/DIBUJO:[\s\S]*/i, "")
    .replace(/T[ÍI]TULO:/gi, "")
    .replace(/ACTIVIDAD:/gi, "")
    .replace(/\r/g, "")
    .trim();
}


/* =========================
   PREPARAR LINEAS
========================= */

function prepararLineas(texto, max) {

  const resultado = [];

  const parrafos =
    texto.split("\n");

  for (const parrafo of parrafos) {

    const palabras =
      parrafo.trim().split(/\s+/);

    let linea = "";

    for (const palabra of palabras) {

      if (
        (linea + " " + palabra).trim().length > max
      ) {

        if (linea.trim()) {
          resultado.push(linea.trim());
        }

        linea = palabra;

      } else {

        linea =
          (linea + " " + palabra).trim();
      }
    }

    if (linea.trim()) {
      resultado.push(linea.trim());
    }

    resultado.push("");
  }

  return resultado;
}


/* =========================
   ESCAPAR TEXTO PDF
========================= */

function escaparPDF(texto) {

  return texto
    .replace(/[áàäâ]/gi, "a")
    .replace(/[éèëê]/gi, "e")
    .replace(/[íìïî]/gi, "i")
    .replace(/[óòöô]/gi, "o")
    .replace(/[úùüû]/gi, "u")
    .replace(/ñ/gi, "n")
    .replace(/¿/g, "")
    .replace(/¡/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
