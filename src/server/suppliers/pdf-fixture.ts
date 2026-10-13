// Small local fixtures for verifying PDF text and OCR import. No external documents.
export function pdfFixture(content: string | Buffer, image = false, width = 1000, height = 220) {
  const stream = image
    ? Buffer.from(`q ${width} 0 0 ${height} 0 0 cm /I1 Do Q`)
    : Buffer.from(`BT /F1 18 Tf 20 180 Td (${String(content).replace(/[()\\]/g, "\\$&")}) Tj ET`);
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources ${image ? "<< /XObject << /I1 5 0 R >> >>" : "<< /Font << /F1 5 0 R >> >>"} /Contents 4 0 R >>`,
    ),
    Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      Buffer.from("\nendstream"),
    ]),
    image
      ? Buffer.concat([
          Buffer.from(
            `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${(content as Buffer).length} >>\nstream\n`,
          ),
          content as Buffer,
          Buffer.from("\nendstream"),
        ])
      : Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
  ];
  const chunks = [Buffer.from("%PDF-1.4\n")],
    offsets = [0];
  let length = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const b = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from("\nendobj\n"),
    ]);
    chunks.push(b);
    length += b.length;
  });
  chunks.push(
    Buffer.from(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((o) => `${String(o).padStart(10, "0")} 00000 n `)
        .join(
          "\n",
        )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`,
    ),
  );
  return Buffer.concat(chunks);
}
