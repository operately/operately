import { useState } from "react";

export interface AddFileProps {
  file: any;
  setFile: (file: File) => void;
  hideAddFilePopUp: () => void;
  showAddFilePopUp: () => void;
}

export function useAddFile(): AddFileProps {
  const [file, setFile] = useState<File>();

  const showAddFilePopUp = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.onchange = (e: any) => {
      const file = e.target?.files[0];
      setFile(file);
    };

    fileInput.click();
  };

  const hideAddFilePopUp = () => setFile(undefined);

  return { file, setFile, showAddFilePopUp, hideAddFilePopUp };
}
