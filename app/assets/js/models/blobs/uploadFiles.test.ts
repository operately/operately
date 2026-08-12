import { uploadFile } from "./uploadFile";
import { resizeImage } from "./utils";
import { uploadFilesWithPreviews } from "./uploadFiles";
import type { AddFileUploadItem } from "turboui";

jest.mock("./uploadFile", () => ({
  uploadFile: jest.fn(),
}));

jest.mock("./utils", () => ({
  resizeImage: jest.fn(),
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

  await expect(uploadFilesWithPreviews({ items: [item], setProgress, persist })).resolves.toBe("saved");

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

test("uploads an image and its generated preview", async () => {
  const image = new File(["image"], "Launch.png", { type: "image/png" });
  const preview = new File(["preview"], "Launch.png", { type: "image/png" });
  const persist = jest.fn().mockResolvedValue(undefined);
  resizePreview.mockResolvedValue(preview);
  uploadBlob.mockResolvedValueOnce({ id: "blob-1" }).mockResolvedValueOnce({ id: "preview-1" });

  await uploadFilesWithPreviews({ items: [uploadItem(image)], setProgress: jest.fn(), persist });

  expect(resizePreview).toHaveBeenCalledWith(image, { width: 100 });
  expect(uploadBlob).toHaveBeenNthCalledWith(1, image, expect.any(Function));
  expect(uploadBlob).toHaveBeenNthCalledWith(2, preview, expect.any(Function));
  expect(persist).toHaveBeenCalledWith([expect.objectContaining({ blobId: "blob-1", previewBlobId: "preview-1" })]);
});

test("completes progress without NaN when uploading zero-byte files", async () => {
  const empty = new File([], "Empty.txt", { type: "text/plain" });
  const setProgress = jest.fn();
  const persist = jest.fn().mockResolvedValue(undefined);
  uploadBlob.mockImplementation(async (_file: File, onProgress: (progress: number) => void) => {
    onProgress(100);
    return { id: "blob-empty" };
  });

  await uploadFilesWithPreviews({ items: [uploadItem(empty)], setProgress, persist });

  expect(setProgress).not.toHaveBeenCalledWith(NaN);
  expect(setProgress).toHaveBeenLastCalledWith(100);
  expect(persist).toHaveBeenCalledWith([
    expect.objectContaining({ name: "Empty.txt", blobId: "blob-empty" }),
  ]);
});

test("waits for the original and preview uploads before persisting files", async () => {
  const image = new File(["image"], "Launch.png", { type: "image/png" });
  const preview = new File(["preview"], "Launch.png", { type: "image/png" });
  const originalUpload = deferredUpload();
  const previewUpload = deferredUpload();
  const persist = jest.fn().mockResolvedValue(undefined);

  resizePreview.mockResolvedValue(preview);
  uploadBlob.mockImplementation((file: File) => (file === image ? originalUpload.promise : previewUpload.promise));

  const upload = uploadFilesWithPreviews({ items: [uploadItem(image)], setProgress: jest.fn(), persist });

  await nextEventLoopTurn();
  expect(uploadBlob).toHaveBeenCalledTimes(2);
  expect(persist).not.toHaveBeenCalled();

  originalUpload.resolve({ id: "blob-1" });
  await Promise.resolve();
  expect(persist).not.toHaveBeenCalled();

  previewUpload.resolve({ id: "preview-1" });
  await upload;

  expect(persist).toHaveBeenCalledWith([
    expect.objectContaining({ blobId: "blob-1", previewBlobId: "preview-1" }),
  ]);
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

function deferredUpload() {
  let resolve: (blob: { id: string }) => void = () => undefined;
  const promise = new Promise<{ id: string }>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

function nextEventLoopTurn() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
