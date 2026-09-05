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

    const actividades = [];

    for (let i = 1; i <= paginas; i++) {
      actividades.push({
        numero: i,
        titulo: `Actividad ${i}: ${tema}`,
        texto:
          i % 3 === 1
            ? `Observa y aprende sobre ${tema}. Después, realiza la actividad siguiendo las instrucciones.`
            : i % 3 === 2
            ? `Colorea, rodea o une los elementos relacionados con ${tema}. ¡Hazlo con mucha atención!`
            : `Dibuja y completa esta actividad sobre ${tema}. Usa tu imaginación y diviértete.`
      });
    }

    const texto = actividades
      .map(
        p =>
          `PÁGINA ${p.numero}\n` +
          `TÍTULO: ${p.titulo}\n` +
          `ACTIVIDAD: ${p.texto}\n`
      )
      .join("\n");

    const pdf = crearPDF(actividades, tema, tipo, edad, estilo);

    return res.status(200).json({
      texto,
      download: "data:application/pdf;base64," + pdf
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.status(500).json({
      error: error.message || "Error interno"
    });
  }
}

function crearPDF(actividades, tema, tipo, edad, estilo) {

  const objetos = [];

  objetos.push(
    `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`
  );

  const pageIds = [];

  for (let i = 0; i < actividades.length; i++) {
    pageIds.push(3 + i * 2);
  }

  objetos.push(
    `2 0 obj
<<
/Type /Pages
/Count ${actividades.length}
/Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}]
>>
endobj
`
  );

  let siguienteId = 3;

  for (const pagina of actividades) {

    const pageId = siguienteId++;
    const contentId = siguienteId++;

    const lineas = [
      `IMPACTO IA`,
      ``,
      `Página ${pagina.numero}`,
      ``,
      pagina.titulo,
      ``,
      `Tema: ${tema}`,
      `Tipo: ${tipo}`,
      `Edad: ${edad}`,
      `Estilo: ${estilo}`,
      ``,
      pagina.texto,
      ``,
      `Dibujo para colorear:`,
      `____________________________`,
      ``,
      `____________________________`,
      ``,
      `____________________________`
    ];

    let stream =
      `BT
/F1 16 Tf
50 790 Td
`;

    let primera = true;

    for (const linea of lineas) {

      if (!primera) {
        stream += `0 -28 Td\n`;
      }

      stream += `(${escaparPDF(linea)}) Tj\n`;

      primera = false;
    }

    stream += `ET`;

    objetos.push(
      `${pageId} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources <<
/Font <<
/F1 ${3 + actividades.length * 2} 0 R
>>
>>
/Contents ${contentId} 0 R
>>
endobj
`
    );

    objetos.push(
      `${contentId} 0 obj
<<
/Length ${Buffer.byteLength(stream, "binary")}
>>
stream
${stream}
endstream
endobj
`
    );
  }

  const fontId = 3 + actividades.length * 2;

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

  let pdf = `%PDF-1.4\n`;
  const offsets = [0];

  for (const objeto of objetos) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += objeto;
  }

  const xref = Buffer.byteLength(pdf, "binary");

  pdf += `xref
0 ${objetos.length + 1}
0000000000 65535 f 
`;

  for (let i = 1; i < offsets.length; i++) {
    pdf +=
      String(offsets[i]).padStart(10, "0") +
      ` 00000 n 
`;
  }

  pdf += `trailer
<<
/Size ${objetos.length + 1}
/Root 1 0 R
>>
startxref
${xref}
%%EOF`;

  return Buffer.from(pdf, "binary").toString("base64");
}

function escaparPDF(texto) {

  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
