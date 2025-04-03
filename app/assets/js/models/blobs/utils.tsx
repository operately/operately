interface FileDimensions {
  width: number;
  height: number;
}

export function findImageDimensions(imgFile: File): Promise<FileDimensions> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(imgFile);
  });
}

export function findVideoDimensions(videoFile: File): Promise<FileDimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };

    video.onerror = (error) => {
      reject(error);
    };
  });
}

export async function resizeImage(imgFile: File, { height, width }: Partial<FileDimensions>): Promise<File> {
  const { width: originalWidth, height: originalHeight } = await findImageDimensions(imgFile);

  if (!height && !width) {
    throw new Error("Either targetHeight or targetWidth must be specified.");
  } else if (width) {
    height = Math.round((width / originalWidth) * originalHeight);
  } else if (height) {
    width = Math.round((height / originalHeight) * originalWidth);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width!;
        canvas.height = height!;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(image, 0, 0, width!, height!);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], imgFile.name, { type: imgFile.type });
              resolve(resizedFile);
            } else {
              reject(new Error("Canvas conversion to Blob failed"));
            }
          },
          imgFile.type,
          0.9,
        );
      };

      image.onerror = (error) => {
        reject(error);
      };

      image.src = readerEvent.target?.result as string;
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(imgFile);
  });
}

export function findFileSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  for (let unit of units) {
    if (size < 1024) return `${Math.round(size)}${unit}`;
    size /= 1024;
  }

  return "";
}
