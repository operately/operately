import { showErrorToast } from "turboui";
import { uploadFile } from "./index";
import { createFileBlobs } from "./blobLifecycle";

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
}));

jest.mock("./blobLifecycle", () => ({
  createFileBlobs: jest.fn(),
  createAvatarBlobs: jest.fn(),
  createImportArtifactBlobs: jest.fn(),
  confirmBlobUpload: jest.fn(),
}));

describe("blob upload model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a toast when createBlob is blocked by the storage limit", async () => {
    const error = {
      response: {
        data: {
          message:
            "This company has reached its storage limit: 1 GB of 1 GB used. Uploading files is blocked until this company is back within its plan limits.",
          details: {
            code: "storage_limit_exceeded",
            limit_key: "storage_bytes",
            current_usage: 1_073_741_824,
            requested_delta: 1024,
            projected_usage: 1_073_742_848,
            limit: 1_073_741_824,
            remaining: 0,
            near_limit: true,
            blocked: true,
            enforced: true,
            recommended_upgrade: null,
          },
        },
      },
    };

    jest.mocked(createFileBlobs).mockRejectedValue(error);

    await expect(uploadFile(new File(["hello"], "test.txt", { type: "text/plain" }), jest.fn())).rejects.toBe(error);

    expect(showErrorToast).toHaveBeenCalledWith("Storage limit reached", error.response.data.message);
  });

  it("falls back to the shared storage-limit copy when the backend message is missing", async () => {
    const error = {
      response: {
        data: {
          details: {
            code: "storage_limit_exceeded",
            limit_key: "storage_bytes",
            current_usage: 1_073_741_824,
            requested_delta: 1024,
            projected_usage: 1_073_742_848,
            limit: 1_073_741_824,
            remaining: 0,
            near_limit: true,
            blocked: true,
            enforced: true,
            recommended_upgrade: null,
          },
        },
      },
    };

    jest.mocked(createFileBlobs).mockRejectedValue(error);

    await expect(uploadFile(new File(["hello"], "test.txt", { type: "text/plain" }), jest.fn())).rejects.toBe(error);

    expect(showErrorToast).toHaveBeenCalledWith(
      "Storage limit reached",
      "This company has reached its storage limit: 1 GB of 1 GB used. Uploading files is blocked until this company is back within its plan limits.",
    );
  });
});
