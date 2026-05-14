import { describe, it } from "node:test";
import * as assert from "node:assert";
import type { Stats } from "node:fs";
import { executeCustomEndpointCommand, validateCustomEndpointImplementations } from "../../commands/custom-endpoints";
import { createRegistry } from "../../commands/registry";
import { UsageError } from "../../core/parser";
import { fixtureCatalog } from "./fixture-catalog";

function findEndpoint(fullName: string) {
  const endpoint = createRegistry(fixtureCatalog).endpoints.find((candidate) => candidate.full_name === fullName);

  assert.ok(endpoint, `Expected fixture endpoint '${fullName}' to exist.`);
  return endpoint;
}

function buildInput(
  endpointInputs: Record<string, unknown>,
  registry = createRegistry(fixtureCatalog),
) {
  return {
    endpoint: findEndpoint("people/update_picture"),
    endpointInputs,
    registry,
    runtime: {
      baseUrl: "https://app.operately.com",
      token: "op_live_test",
      timeoutMs: 30_000,
    },
    globalFlags: {
      compact: false,
      verbose: false,
    },
  };
}

describe("custom endpoint registry", () => {
  it("validates the built-in custom endpoint implementations", () => {
    assert.doesNotThrow(() => validateCustomEndpointImplementations());
  });
});

describe("custom endpoint execution", () => {
  it("uploads an avatar file through the hidden blob flow", async () => {
    const calls: Array<{ kind: string; path?: string; inputs?: Record<string, unknown> }> = [];

    const payload = await executeCustomEndpointCommand(buildInput({ avatar_file: "./avatar.png" }), {
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

    const payload = await executeCustomEndpointCommand(buildInput({ clear: true }), {
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
    await assert.rejects(executeCustomEndpointCommand(buildInput({})), (error: unknown) => {
      assert.ok(error instanceof UsageError);
      assert.equal(error.message, "Specify exactly one of '--avatar-file <path>' or '--clear'.");
      return true;
    });
  });

  it("rejects conflicting mode flags", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput({ avatar_file: "./avatar.png", clear: true })),
      (error: unknown) => {
        assert.ok(error instanceof UsageError);
        assert.equal(error.message, "Specify exactly one of '--avatar-file <path>' or '--clear'.");
        return true;
      },
    );
  });

  it("surfaces unreadable file paths as usage errors", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput({ avatar_file: "./missing.png" }), {
        callEndpoint: async () => ({ me: { id: "person-1" } }),
        readFile: () => {
          throw new Error("ENOENT");
        },
      }),
      (error: unknown) => {
        assert.ok(error instanceof UsageError);
        assert.ok(error.message.includes("Failed to read file for '--avatar-file'"));
        return true;
      },
    );
  });

  it("fails when blob creation does not return upload metadata", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput({ avatar_file: "./avatar.png" }), {
        callEndpoint: async () => ({ me: { id: "person-1" } }),
        callExternalMutation: async ({ path }) => {
          if (path === "/create_avatar_blob") {
            return { blobs: [] };
          }

          return { success: true };
        },
        readFile: () => Buffer.from("avatar-bytes"),
        statFile: () => ({ size: 12 } as Stats),
        inferMimeType: () => "image/png",
      }),
      /Failed to create avatar blob for upload/,
    );
  });

  it("surfaces upload failures", async () => {
    await assert.rejects(
      executeCustomEndpointCommand(buildInput({ avatar_file: "./avatar.png" }), {
        callEndpoint: async () => ({ me: { id: "person-1" } }),
        callExternalMutation: async ({ path }) => {
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
        uploadToSignedUrl: async () => {
          throw new Error("upload failed");
        },
        readFile: () => Buffer.from("avatar-bytes"),
        statFile: () => ({ size: 12 } as Stats),
        inferMimeType: () => "image/png",
      }),
      /upload failed/,
    );
  });

  it("surfaces final update failures", async () => {
    let updateCallSeen = false;

    await assert.rejects(
      executeCustomEndpointCommand(buildInput({ avatar_file: "./avatar.png" }), {
        callEndpoint: async () => ({ me: { id: "person-1" } }),
        callExternalMutation: async ({ path }) => {
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

          updateCallSeen = true;
          throw new Error("update failed");
        },
        uploadToSignedUrl: async () => undefined,
        readFile: () => Buffer.from("avatar-bytes"),
        statFile: () => ({ size: 12 } as Stats),
        inferMimeType: () => "image/png",
      }),
      /update failed/,
    );

    assert.equal(updateCallSeen, true);
  });
});

describe("custom endpoint registration", () => {
  it("accepts catalogs where all custom endpoints are implemented", () => {
    assert.doesNotThrow(() => validateCustomEndpointImplementations([findEndpoint("people/update_picture")]));
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
