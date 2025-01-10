import React, { useMemo, useState } from "react";

export interface AddFileProps {
  files: File[] | undefined;
  setFiles: React.Dispatch<React.SetStateAction<File[] | undefined>>;
  selectFiles: () => void;
  filesSelected: boolean;
}

export function useAddFile(): AddFileProps {
  const [files, setFiles] = useState<File[]>();

  const filesSelected = useMemo(() => {
    return Boolean(files && files.length > 0);
  }, [files]);

  const selectFiles = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.onchange = (e: any) => {
      if (e.target?.files) {
        setFiles(Array.from(e.target.files));
      }
    };

    fileInput.click();
  };

  return { files, setFiles, selectFiles, filesSelected };
}
