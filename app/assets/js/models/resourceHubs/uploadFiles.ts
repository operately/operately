import { resizeImage, uploadFile } from "@/models/blobs";
import type { AddFileUploadItem } from "turboui";

export interface UploadedFile {
  name: string;
  description: unknown;
  blobId: string;
  previewBlobId?: string;
}

interface UploadFilesArgs<Result> {
  items: AddFileUploadItem[];
  setProgress: (progress: number) => void;
  persist: (files: UploadedFile[]) => Promise<Result>;
}

export async function uploadFiles<Result>({ items, setProgress, persist }: UploadFilesArgs<Result>): Promise<Result> {
  const uploader = new FileUploader(items, setProgress);
  const files = await uploader.upload();

  return persist(files);
}

interface FileForUpload {
  file: File;
  blobId?: string;
  progress: number;
}

class FileUploader {
  private items: UploadItem[];
  private totalSize = 0;
  private totalProgress = 0;

  constructor(
    items: AddFileUploadItem[],
    private setProgress: (progress: number) => void,
  ) {
    this.items = items.map((item) => new UploadItem(item));
  }

  async upload(): Promise<UploadedFile[]> {
    await this.generatePreviews();
    this.calculateTotalSize();
    await Promise.all(this.items.map((item) => this.uploadItem(item)));

    return this.items.map((item) => item.toUploadedFile());
  }

  private async uploadItem(item: UploadItem) {
    const [blobId, previewBlobId] = await Promise.all([
      this.uploadSingleBlob(item.mainFile),
      this.uploadSingleBlob(item.previewFile),
    ]);

    item.mainFile.blobId = blobId;
    if (item.previewFile) item.previewFile.blobId = previewBlobId;
  }

  private async uploadSingleBlob(file: FileForUpload | undefined) {
    if (!file) return undefined;

    const blob = await uploadFile(file.file, (progress) => {
      const ratio = file.file.size / this.totalSize;
      this.totalProgress += (progress - file.progress) * ratio;
      file.progress = progress;
      this.setProgress(this.totalProgress);
    });

    return blob.id;
  }

  private async generatePreviews() {
    await Promise.all(
      this.items.map(async (item) => {
        if (!item.source.mainFile.type.includes("image")) return;

        const file = await resizeImage(item.source.mainFile, { width: 100 });
        item.previewFile = { file, progress: 0 };
      }),
    );
  }

  private calculateTotalSize() {
    this.totalSize = this.items.reduce(
      (total, item) => total + item.mainFile.file.size + (item.previewFile?.file.size ?? 0),
      0,
    );
  }
}

class UploadItem {
  mainFile: FileForUpload;
  previewFile?: FileForUpload;

  constructor(readonly source: AddFileUploadItem) {
    this.mainFile = { file: source.mainFile, progress: 0 };
  }

  toUploadedFile(): UploadedFile {
    if (!this.mainFile.blobId)
      throw new Error(`File upload did not return a blob ID for ${this.source.nameWithExtension}`);

    return {
      name: this.source.nameWithExtension,
      description: this.source.description,
      blobId: this.mainFile.blobId,
      previewBlobId: this.previewFile?.blobId,
    };
  }
}
