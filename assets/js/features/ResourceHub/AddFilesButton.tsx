import React from "react";

import { IconFile, IconFolder, IconUpload } from "@tabler/icons-react";
import { OptionsButton } from "@/components/Buttons";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function AddFilesButton() {
  const { navigateToNewDocument, toggleShowAddFolder, showAddFilePopUp } = useNewFileModalsContext();

  return (
    <div className="w-min mt-2">
      <OptionsButton
        align="start"
        options={[
          { icon: IconFile, label: "Write a new document", action: navigateToNewDocument, testId: "new-document" },
          { icon: IconFolder, label: "Create a new folder", action: toggleShowAddFolder, testId: "new-folder" },
          { icon: IconUpload, label: "Upload files", action: showAddFilePopUp, testId: "upload-files" },
        ]}
        testId="add-options"
      />
    </div>
  );
}
