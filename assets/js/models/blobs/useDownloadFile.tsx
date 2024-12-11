import { useState } from "react";

async function downloadFile(fileUrl: string, fileName: string) {
  const res = await fetch(fileUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function useDownloadFile(fileUrl: string, fileName: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDownload = () => {
    setLoading(true);
    setError(null);

    downloadFile(fileUrl, fileName)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  return [handleDownload, { loading, error }] as const;
}
