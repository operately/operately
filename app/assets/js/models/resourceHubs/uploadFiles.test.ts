import { resizeImage, uploadFile } from "@/models/blobs";
import type { AddFileUploadItem } from "turboui";
import { uploadFiles } from "./uploadFiles";

jest.mock("@/models/blobs", () => ({
  resizeImage: jest.fn(),
  uploadFile: jest.fn(),
}));

const uploadBlob = uploadFile as jest.Mock;
const resizePreview = resizeImage as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test("uploads selected files and passes their blob metadata to persistence", async () => {
  const file = new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" });
  const item = uploadItem(file);
  const setProgress = jest.fn();
  const persist = jest.fn().mockResolvedValue("saved");
  uploadBlob.mockImplementation(async (_file: File, onProgress: (progress: number) => void) => {
    onProgress(100);
    return { id: "blob-1" };
  });

  await expect(uploadFiles({ items: [item], setProgress, persist })).resolves.toBe("saved");

  expect(persist).toHaveBeenCalledWith([
    {
      name: "Launch-plan.pdf",
      description: item.description,
      blobId: "blob-1",
      previewBlobId: undefined,
    },
  ]);
  expect(setProgress).toHaveBeenLastCalledWith(100);
});

test("uploads a generated preview for images", async () => {
  const image = new File(["image"], "Launch.png", { type: "image/png" });
  const preview = new File(["preview"], "Launch.png", { type: "image/png" });
  const persist = jest.fn().mockResolvedValue(undefined);
  resizePreview.mockResolvedValue(preview);
  uploadBlob.mockResolvedValueOnce({ id: "blob-1" }).mockResolvedValueOnce({ id: "preview-1" });

  await uploadFiles({ items: [uploadItem(image)], setProgress: jest.fn(), persist });

  expect(resizePreview).toHaveBeenCalledWith(image, { width: 100 });
  expect(persist).toHaveBeenCalledWith([expect.objectContaining({ blobId: "blob-1", previewBlobId: "preview-1" })]);
});

function uploadItem(mainFile: File): AddFileUploadItem {
  return {
    name: "Launch-plan",
    nameWithExtension: mainFile.name,
    extension: mainFile.name.split(".").at(-1) ?? "",
    description: { type: "doc", content: [] },
    mainFile,
    fileType: mainFile.type,
  };
}
