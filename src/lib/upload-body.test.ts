import { expect, it, vi } from "vitest";
import { MAX_UPLOAD_BODY, readUploadForm } from "./upload-body";

it("rejects oversized streaming uploads even without Content-Length", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_UPLOAD_BODY + 1));
    },
    cancel,
  });
  const request = new Request("http://localhost/api/upload", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
  await expect(readUploadForm(request)).rejects.toBeInstanceOf(RangeError);
  expect(cancel).toHaveBeenCalled();
});

it("parses a valid multipart form", async () => {
  const body = new FormData();
  body.append("file", new File(["image"], "photo.png", { type: "image/png" }));
  const form = await readUploadForm(
    new Request("http://localhost/api/upload", { method: "POST", body }),
  );
  expect((form.get("file") as File).name).toBe("photo.png");
});
