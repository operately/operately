import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { createFileBlobs, createAvatarBlobs, createImportArtifactBlobs, confirmBlobUpload } from "./blobLifecycle";

jest.mock("turboui", () => ({}));

afterEach(() => {
  jest.restoreAllMocks();
  queryClient.clear();
});

it.each(["file", "avatar", "import", "confirmation"])(
  "executes %s writes through the mutation cache without retry",
  async (kind) => {
    const request = jest.fn().mockRejectedValue(new Error("offline"));
    jest.spyOn(Api, "createBlobMutationOptions").mockReturnValue({ mutationFn: request });
    jest.spyOn(Api, "createAvatarBlobMutationOptions").mockReturnValue({ mutationFn: request });
    jest
      .spyOn(Api.company_transfers, "createImportArtifactBlobsMutationOptions")
      .mockReturnValue({ mutationFn: request });
    jest.spyOn(Api, "markBlobUploadedMutationOptions").mockReturnValue({ mutationFn: request });
    const operation =
      kind === "confirmation"
        ? confirmBlobUpload({ blobId: "blob-1" })
        : (kind === "file" ? createFileBlobs : kind === "avatar" ? createAvatarBlobs : createImportArtifactBlobs)({
            files: [],
          });
    expect(queryClient.getMutationCache().getAll()).toHaveLength(1);
    await expect(operation).rejects.toThrow("offline");
    expect(request).toHaveBeenCalledTimes(1);
    expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe("error");
  },
);
