import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { uploadFile, uploadAvatarFile, uploadImportArtifactFile } from "./uploadFile";
import { createSentryAxiosClient } from "@/utils/axiosErrorReporting";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("turboui/CompanyBilling", () => ({ formatStorageBytes: (value: number) => String(value) }));
jest.mock("@/utils/axiosErrorReporting", () => ({ createSentryAxiosClient: jest.fn() }));
jest.mock("@/utils/csrf_token", () => ({ __esModule: true, default: () => "csrf-token" }));
jest.mock("./utils", () => ({
  findImageDimensions: async () => ({ width: 20, height: 10 }),
  findVideoDimensions: async () => ({ width: 30, height: 15 }),
}));

const blob = { id: "blob-1", signedUploadUrl: "/upload", url: "/download", uploadStrategy: "direct" };
let create: jest.Mock;
let avatar: jest.Mock;
let artifact: jest.Mock;
let confirm: jest.Mock;
let put: jest.Mock;

beforeEach(() => {
  create = jest.fn().mockResolvedValue({ blobs: [blob] });
  avatar = jest.fn().mockResolvedValue({ blobs: [blob] });
  artifact = jest.fn().mockResolvedValue({ blobs: [blob] });
  confirm = jest.fn().mockResolvedValue({ blob: { id: blob.id } });
  put = jest.fn().mockResolvedValue({});
  jest.spyOn(Api, "createBlobMutationOptions").mockReturnValue({ mutationFn: create });
  jest.spyOn(Api, "createAvatarBlobMutationOptions").mockReturnValue({ mutationFn: avatar });
  jest
    .spyOn(Api.company_transfers, "createImportArtifactBlobsMutationOptions")
    .mockReturnValue({ mutationFn: artifact });
  jest.spyOn(Api, "markBlobUploadedMutationOptions").mockReturnValue({ mutationFn: confirm });
  jest
    .mocked(createSentryAxiosClient)
    .mockReturnValue({ put } as unknown as ReturnType<typeof createSentryAxiosClient>);
});

afterEach(() => {
  jest.restoreAllMocks();
  queryClient.clear();
});

it.each(["file", "avatar", "import"])("preserves the %s upload endpoint and return value", async (kind) => {
  const upload = kind === "file" ? uploadFile : kind === "avatar" ? uploadAvatarFile : uploadImportArtifactFile;
  const result = await upload(new File(["hello"], "test.txt", { type: "text/plain" }), jest.fn());
  expect(result).toEqual({ id: "blob-1", url: "/download" });
  expect(kind === "file" ? create : kind === "avatar" ? avatar : artifact).toHaveBeenCalledTimes(1);
  expect(confirm).toHaveBeenCalledWith({ blobId: "blob-1" }, expect.anything());
});

it("waits for transfer before confirmation and forwards direct-upload progress", async () => {
  let finish: () => void = () => {};
  put.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const progress = jest.fn();
  const upload = uploadFile(new File(["data"], "file.txt"), progress);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(put).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
  put.mock.calls[0][2].onUploadProgress({ loaded: 2, total: 4 });
  expect(progress).toHaveBeenCalledWith(50);
  finish();
  await upload;
  expect(confirm).toHaveBeenCalledTimes(1);
});

it("preserves multipart transfers and image metadata", async () => {
  create.mockResolvedValue({ blobs: [{ ...blob, uploadStrategy: "multipart" }] });
  await uploadFile(new File(["image"], "test.png", { type: "image/png" }), jest.fn());
  expect(create.mock.calls[0][0].files[0]).toMatchObject({ filename: "test.png", width: 20, height: 10 });
  expect(put.mock.calls[0][1]).toBeInstanceOf(FormData);
  expect(put.mock.calls[0][2].headers["Content-Type"]).toBe("multipart/form-data");
});

it.each(["id", "url", "signedUploadUrl"])("rejects missing blob %s before transfer", async (field) => {
  create.mockResolvedValue({ blobs: [{ ...blob, [field]: null }] });
  await expect(uploadFile(new File([], "test.txt"), jest.fn())).rejects.toThrow("missing");
  expect(put).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});

it.each([null, []])("rejects absent blobs (%s)", async (blobs) => {
  create.mockResolvedValue({ blobs });
  await expect(uploadFile(new File([], "test.txt"), jest.fn())).rejects.toThrow("missing");
  expect(put).not.toHaveBeenCalled();
});

it("does not confirm a failed transfer", async () => {
  put.mockRejectedValue(new Error("transfer failed"));
  await expect(uploadFile(new File([], "test.txt"), jest.fn())).rejects.toThrow("transfer failed");
  expect(confirm).not.toHaveBeenCalled();
});

it("propagates confirmation failures", async () => {
  confirm.mockRejectedValue(new Error("confirmation failed"));
  await expect(uploadFile(new File([], "test.txt"), jest.fn())).rejects.toThrow("confirmation failed");
  expect(put).toHaveBeenCalledTimes(1);
});

it("rejects a missing confirmation blob", async () => {
  confirm.mockResolvedValue({});
  await expect(uploadFile(new File([], "test.txt"), jest.fn())).rejects.toThrow("confirm");
});
