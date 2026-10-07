export const MAX_UPLOAD_BODY = 9 * 1024 * 1024;

// Bound bytes before multipart parsing, including chunked requests without Content-Length.
export async function readUploadForm(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BODY) {
    throw new RangeError("Upload body too large");
  }
  if (!request.body) throw new Error("Missing body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPLOAD_BODY) {
        await reader.cancel();
        throw new RangeError("Upload body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(bytes, {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  }).formData();
}
