import { useState } from "react";

export function useDownloadFile(fileUrl: string, fileName: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadFile = () => {
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = fileName;
        anchor.click();

        URL.revokeObjectURL(url);
      })
      .catch((e) => {
        setError(e);
        throw e;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return [downloadFile, { loading, error }] as const;
}
