import { afterEach, describe, it } from "node:test";
import * as assert from "node:assert";
import axios from "axios";
import { uploadToSignedUrl } from "../../core/uploads/signed-url";

const originalFormDataDescriptor = Object.getOwnPropertyDescriptor(globalThis, "FormData");
const originalBlobDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Blob");
const originalAxiosPut = axios.put;

function restoreGlobal(name: "FormData" | "Blob", descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    delete (globalThis as Record<string, unknown>)[name];
  }
}

afterEach(() => {
  restoreGlobal("FormData", originalFormDataDescriptor);
  restoreGlobal("Blob", originalBlobDescriptor);
  axios.put = originalAxiosPut;
});

describe("uploadToSignedUrl", () => {
  it("fails fast when multipart upload globals are unavailable", async () => {
    Object.defineProperty(globalThis, "FormData", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    Object.defineProperty(globalThis, "Blob", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    let called = false;
    axios.put = (async () => {
      called = true;
      return {} as any;
    }) as typeof axios.put;

    await assert.rejects(
      uploadToSignedUrl({
        filePath: "./avatar.png",
        fileBytes: Buffer.from("avatar-bytes"),
        signedUploadUrl: "https://uploads.example.com/avatar.png",
        uploadStrategy: "multipart",
        contentType: "image/png",
        timeoutMs: 30_000,
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Multipart upload requires Node.js 18+ with global FormData and Blob support.");
        return true;
      },
    );

    assert.equal(called, false);
  });
});
