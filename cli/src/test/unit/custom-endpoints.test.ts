import { describe, it } from "node:test";
import * as assert from "node:assert";
import type { Stats } from "node:fs";
import { executeCustomEndpointCommand, validateCustomEndpointImplementations } from "../../commands/custom-endpoints";
import { createRegistry } from "../../commands/registry";
import { UsageError } from "../../core/parser";
import { fixtureCatalog } from "./fixture-catalog";

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+tmH0AAAAASUVORK5CYII=",
  "base64",
);

function findEndpoint(fullName: string) {
  const endpoint = createRegistry(fixtureCatalog).endpoints.find((candidate) => candidate.full_name === fullName);

  assert.ok(endpoint, `Expected fixture endpoint '${fullName}' to exist.`);
  return endpoint;
}

function buildInput(
  fullName: string,
  endpointInputs: Record<string, unknown>,
  registry = createRegistry(fixtureCatalog),
) {
  return {
    endpoint: findEndpoint(fullName),
    endpointInputs,
    registry,
    runtime: {
      baseUrl: "https://app.operately.com",
      token: "op_live_test",
      timeoutMs: 30_000,
    },
    globalFlags: {
      compact: false,
      json: false,
      verbose: false,
    },
  };
}

describe("custom endpoint registry", () => {
  it("validates the built-in custom endpoint implementations", () => {
    assert.doesNotThrow(() => validateCustomEndpointImplementations());
  });
});

describe("people/update_picture", () => {
  it("uploads an avatar file through the hidden blob flow", async () => {
    const calls: Array<{ kind: string; path?: string; inputs?: Record<string, unknown> }> = [];

    const payload = await executeCustomEndpointCommand(buildInput("people/update_picture", { avatar_file: "./avatar.png" }), {
      callEndpoint: async ({ endpoint, inputs }) => {
        calls.push({ kind: "query", path: endpoint.path, inputs });
        return { me: { id: "person-1" } };
      },
      callExternalMutation: async ({ path, inputs }) => {
        calls.push({ kind: "mutation", path, inputs });

        if (path === "/create_avatar_blob") {
          return {
            blobs: [
              {
                id: "blob-1",
                url: "https://app.operately.com/media/avatar.png",
                signed_upload_url: "https://uploads.example.com/avatar.png",
                upload_strategy: "direct",
              },
            ],
          };
        }

        return { success: true };
      },
      uploadToSignedUrl: async ({ signedUploadUrl, contentType, fileBytes }) => {
        calls.push({
          kind: "upload",
          path: signedUploadUrl,
          inputs: {
            contentType,
            size: fileBytes.byteLength,
          },
        });
      },
      readFile: () => Buffer.from("avatar-bytes"),
      statFile: () => ({ size: 12 } as Stats),
      inferMimeType: () => "image/png",
    });

    assert.deepEqual(payload, { success: true });
    assert.deepEqual(calls, [
      {
        kind: "query",
        path: "/api/external/v1/people/get_me",
        inputs: {},
      },
      {
        kind: "mutation",
        path: "/create_avatar_blob",
        inputs: {
          files: [
            {
              filename: "avatar.png",
              size: 12,
              content_type: "image/png",
            },
          ],
        },
      },
      {
        kind: "upload",
        path: "https://uploads.example.com/avatar.png",
        inputs: {
          contentType: "image/png",
          size: 12,
        },
      },
      {
        kind: "mutation",
        path: "/api/external/v1/people/update_picture",
        inputs: {
          person_id: "person-1",
          avatar_blob_id: "blob-1",
          avatar_url: "https://app.operately.com/media/avatar.png",
        },
      },
    ]);
  });

  it("clears the current avatar without touching the blob flow", async () => {
    const calls: Array<{ kind: string; path?: string; inputs?: Record<string, unknown> }> = [];

    const payload = await executeCustomEndpointCommand(buildInput("people/update_picture", { clear: true }), {
      callEndpoint: async ({ endpoint, inputs }) => {
        calls.push({ kind: "query", path: endpoint.path, inputs });
        return { me: { id: "person-1" } };
      },
      callExternalMutation: async ({ path, inputs }) => {
        calls.push({ kind: "mutation", path, inputs });
        return { success: true };
      },
      uploadToSignedUrl: async () => {
        throw new Error("upload should not run");
      },
      readFile: () => {
        throw new Error("read should not run");
      },
      statFile: () => {
        throw new Error("stat should not run");
      },
      inferMimeType: () => {
        throw new Error("mime should not run");
      },
    });

    assert.deepEqual(payload, { success: true });
    assert.deepEqual(calls, [
      {
        kind: "query",
        path: "/api/external/v1/people/get_me",
        inputs: {},
      },
      {
        kind: "mutation",
        path: "/api/external/v1/people/update_picture",
        inputs: {
          person_id: "person-1",
          avatar_blob_id: null,
          avatar_url: null,
        },
      },
    ]);
  });

  it("rejects missing mode flags", async () => {
    await assert.rejects(executeCustomEndpointCommand(buildInput("people/update_picture", {})), (error: unknown) => {
      assert.ok(error instanceof UsageError);
      assert.equal(error.message, "Specify exactly one of '--avatar-file <path>' or '--clear'.");
      return true;
    });
  });

  it("rejects conflicting mode flags", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("people/update_picture", { avatar_file: "./avatar.png", clear: true })),
      (error: unknown) => {
        assert.ok(error instanceof UsageError);
        assert.equal(error.message, "Specify exactly one of '--avatar-file <path>' or '--clear'.");
        return true;
      },
    );
  });
});

describe("docs_and_files/create_file", () => {
  it("uploads a non-image file through the hidden blob flow", async () => {
    const calls: Array<{ kind: string; path?: string; inputs?: Record<string, unknown> }> = [];

    const payload = await executeCustomEndpointCommand(
      buildInput("docs_and_files/create_file", {
        resource_hub_id: "hub-1",
        file: "./report.pdf",
      }),
      {
        callEndpoint: async () => {
          throw new Error("callEndpoint should not run");
        },
        callExternalMutation: async ({ path, inputs }) => {
          calls.push({ kind: "mutation", path, inputs });

          if (path === "/create_blob") {
            return {
              blobs: [
                {
                  id: "blob-1",
                  url: "https://app.operately.com/blobs/blob-1",
                  signed_upload_url: "https://uploads.example.com/blob-1",
                  upload_strategy: "direct",
                },
              ],
            };
          }

          return { files: [{ id: "file-1" }] };
        },
        uploadToSignedUrl: async ({ signedUploadUrl, contentType, fileBytes }) => {
          calls.push({
            kind: "upload",
            path: signedUploadUrl,
            inputs: {
              contentType,
              size: fileBytes.byteLength,
            },
          });
        },
        readFile: () => Buffer.from("file-bytes"),
        statFile: () => ({ size: 10 } as Stats),
        inferMimeType: () => "application/pdf",
      },
    );

    assert.deepEqual(payload, { files: [{ id: "file-1" }] });
    assert.deepEqual(calls, [
      {
        kind: "mutation",
        path: "/create_blob",
        inputs: {
          files: [
            {
              filename: "report.pdf",
              size: 10,
              content_type: "application/pdf",
            },
          ],
        },
      },
      {
        kind: "upload",
        path: "https://uploads.example.com/blob-1",
        inputs: {
          contentType: "application/pdf",
          size: 10,
        },
      },
      {
        kind: "mutation",
        path: "/mark_blob_uploaded",
        inputs: {
          blob_id: "blob-1",
        },
      },
      {
        kind: "mutation",
        path: "/api/external/v1/docs_and_files/create_file",
        inputs: {
          resource_hub_id: "hub-1",
          files: [
            {
              blob_id: "blob-1",
              preview_blob_id: null,
              name: "report.pdf",
              description: "{\"type\":\"doc\",\"content\":[]}",
            },
          ],
        },
      },
    ]);
  });

  it("uploads an image file with a generated preview and preserves the original extension on renamed files", async () => {
    const calls: Array<{ kind: string; path?: string; inputs?: Record<string, unknown> }> = [];

    const payload = await executeCustomEndpointCommand(
      buildInput("docs_and_files/create_file", {
        resource_hub_id: "hub-1",
        file: "./chart.png",
        folder_id: "folder-1",
        name: "Q2-report",
        description: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Notes\"}]}]}",
        send_notifications_to_everyone: false,
        subscriber_ids: ["person-2"],
      }),
      {
        callEndpoint: async () => {
          throw new Error("callEndpoint should not run");
        },
        callExternalMutation: async ({ path, inputs }) => {
          calls.push({ kind: "mutation", path, inputs });

          if (path === "/create_blob") {
            return {
              blobs: [
                {
                  id: "blob-1",
                  url: "https://app.operately.com/blobs/blob-1",
                  signed_upload_url: "https://uploads.example.com/blob-1",
                  upload_strategy: "direct",
                },
                {
                  id: "blob-2",
                  url: "https://app.operately.com/blobs/blob-2",
                  signed_upload_url: "https://uploads.example.com/blob-2",
                  upload_strategy: "direct",
                },
              ],
            };
          }

          return { files: [{ id: "file-1" }] };
        },
        uploadToSignedUrl: async ({ signedUploadUrl, contentType, fileBytes }) => {
          calls.push({
            kind: "upload",
            path: signedUploadUrl,
            inputs: {
              contentType,
              size: fileBytes.byteLength,
            },
          });
        },
        readFile: () => ONE_BY_ONE_PNG,
        statFile: () => ({ size: ONE_BY_ONE_PNG.byteLength } as Stats),
        inferMimeType: () => "image/png",
      },
    );

    assert.deepEqual(payload, { files: [{ id: "file-1" }] });

    const createBlobCall = calls.find((call) => call.path === "/create_blob");
    assert.ok(createBlobCall);
    assert.ok(createBlobCall.inputs);
    assert.equal(Array.isArray(createBlobCall.inputs.files), true);
    assert.equal((createBlobCall.inputs.files as any[]).length, 2);
    assert.deepEqual((createBlobCall.inputs.files as any[])[0], {
      filename: "chart.png",
      size: ONE_BY_ONE_PNG.byteLength,
      content_type: "image/png",
      width: 1,
      height: 1,
    });
    assert.equal((createBlobCall.inputs.files as any[])[1].filename, "chart.png");
    assert.equal((createBlobCall.inputs.files as any[])[1].content_type, "image/png");
    assert.equal((createBlobCall.inputs.files as any[])[1].width, 100);
    assert.equal((createBlobCall.inputs.files as any[])[1].height, 100);
    assert.equal(typeof (createBlobCall.inputs.files as any[])[1].size, "number");
    assert.ok((createBlobCall.inputs.files as any[])[1].size > 0);

    assert.deepEqual(
      calls.filter((call) => call.path === "/mark_blob_uploaded").map((call) => call.inputs),
      [{ blob_id: "blob-1" }, { blob_id: "blob-2" }],
    );

    const finalCreateCall = calls.find((call) => call.path === "/api/external/v1/docs_and_files/create_file");
    assert.ok(finalCreateCall);
    assert.deepEqual(finalCreateCall.inputs, {
      resource_hub_id: "hub-1",
      folder_id: "folder-1",
      send_notifications_to_everyone: false,
      subscriber_ids: ["person-2"],
      files: [
        {
          blob_id: "blob-1",
          preview_blob_id: "blob-2",
          name: "Q2-report.png",
          description: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Notes\"}]}]}",
        },
      ],
    });
  });

  it("surfaces unreadable file paths as usage errors", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("docs_and_files/create_file", { resource_hub_id: "hub-1", file: "./missing.png" }), {
        readFile: () => {
          throw new Error("ENOENT");
        },
      }),
      (error: unknown) => {
        assert.ok(error instanceof UsageError);
        assert.ok(error.message.includes("Failed to read file for '--file'"));
        return true;
      },
    );
  });

  it("fails when blob creation does not return main upload metadata", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("docs_and_files/create_file", { resource_hub_id: "hub-1", file: "./report.pdf" }), {
        callExternalMutation: async ({ path }) => {
          if (path === "/create_blob") {
            return { blobs: [] };
          }

          return { files: [{ id: "file-1" }] };
        },
        readFile: () => Buffer.from("file-bytes"),
        statFile: () => ({ size: 10 } as Stats),
        inferMimeType: () => "application/pdf",
      }),
      /Failed to create a blob for the main file/,
    );
  });

  it("surfaces upload failures", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("docs_and_files/create_file", { resource_hub_id: "hub-1", file: "./report.pdf" }), {
        callExternalMutation: async ({ path }) => {
          if (path === "/create_blob") {
            return {
              blobs: [
                {
                  id: "blob-1",
                  url: "https://app.operately.com/blobs/blob-1",
                  signed_upload_url: "https://uploads.example.com/blob-1",
                  upload_strategy: "direct",
                },
              ],
            };
          }

          return { files: [{ id: "file-1" }] };
        },
        uploadToSignedUrl: async () => {
          throw new Error("upload failed");
        },
        readFile: () => Buffer.from("file-bytes"),
        statFile: () => ({ size: 10 } as Stats),
        inferMimeType: () => "application/pdf",
      }),
      /upload failed/,
    );
  });

  it("surfaces blob finalization failures", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("docs_and_files/create_file", { resource_hub_id: "hub-1", file: "./report.pdf" }), {
        callExternalMutation: async ({ path }) => {
          if (path === "/create_blob") {
            return {
              blobs: [
                {
                  id: "blob-1",
                  url: "https://app.operately.com/blobs/blob-1",
                  signed_upload_url: "https://uploads.example.com/blob-1",
                  upload_strategy: "direct",
                },
              ],
            };
          }

          if (path === "/mark_blob_uploaded") {
            throw new Error("mark failed");
          }

          return { files: [{ id: "file-1" }] };
        },
        uploadToSignedUrl: async () => undefined,
        readFile: () => Buffer.from("file-bytes"),
        statFile: () => ({ size: 10 } as Stats),
        inferMimeType: () => "application/pdf",
      }),
      /mark failed/,
    );
  });

  it("surfaces final create failures", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput("docs_and_files/create_file", { resource_hub_id: "hub-1", file: "./report.pdf" }), {
        callExternalMutation: async ({ path }) => {
          if (path === "/create_blob") {
            return {
              blobs: [
                {
                  id: "blob-1",
                  url: "https://app.operately.com/blobs/blob-1",
                  signed_upload_url: "https://uploads.example.com/blob-1",
                  upload_strategy: "direct",
                },
              ],
            };
          }

          if (path === "/api/external/v1/docs_and_files/create_file") {
            throw new Error("create failed");
          }

          return { blob: { id: "blob-1", status: "uploaded" } };
        },
        uploadToSignedUrl: async () => undefined,
        readFile: () => Buffer.from("file-bytes"),
        statFile: () => ({ size: 10 } as Stats),
        inferMimeType: () => "application/pdf",
      }),
      /create failed/,
    );
  });
});

describe("custom endpoint registration", () => {
  it("accepts catalogs where all custom endpoints are implemented", () => {
    assert.doesNotThrow(() =>
      validateCustomEndpointImplementations([findEndpoint("people/update_picture"), findEndpoint("docs_and_files/create_file")]),
    );
  });

  it("fails fast when a custom catalog endpoint has no implementation", () => {
    const endpoints = [
      findEndpoint("people/update_picture"),
      {
        ...findEndpoint("people/update_picture"),
        full_name: "people/missing_handler",
        name: "missing_handler",
        path: "/api/external/v1/people/missing_handler",
      },
    ];

    assert.throws(
      () => validateCustomEndpointImplementations(endpoints),
      /Missing custom CLI implementation for endpoint\(s\): people\/missing_handler/,
    );
  });
});
