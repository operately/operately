import { showErrorToast } from "turboui";
import { uploadFile } from "./index";
import { createBlob } from "@/api";

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    company_transfers: {
      createImportArtifactBlobs: jest.fn(),
    },
  },
  createBlob: jest.fn(),
  createAvatarBlob: jest.fn(),
  markBlobUploaded: jest.fn(),
}));

describe("blob upload model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a toast when createBlob is blocked by the storage limit", async () => {
    const error = {
      response: {
        data: {
          message: "This company has reached its storage limit. Upgrade the plan to add more files.",
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

    jest.mocked(createBlob).mockRejectedValue(error);

    await expect(uploadFile(new File(["hello"], "test.txt", { type: "text/plain" }), jest.fn())).rejects.toBe(error);

    expect(showErrorToast).toHaveBeenCalledWith("Storage limit reached", error.response.data.message);
  });
});
