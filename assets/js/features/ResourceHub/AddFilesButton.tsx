import React from "react";

import { IconFile, IconFolder, IconUpload } from "@tabler/icons-react";
import { ResourceHubPermissions } from "@/models/resourceHubs";
import { OptionsButton } from "@/components/Buttons";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function AddFilesButton({ permissions }: { permissions: ResourceHubPermissions }) {
  const { navigateToNewDocument, toggleShowAddFolder, showAddFilePopUp } = useNewFileModalsContext();

  return (
    <div className="w-min mt-2">
      <OptionsButton
        align="start"
        options={[
          {
            icon: IconFile,
            label: "Write a new document",
            action: navigateToNewDocument,
            testId: "new-document",
            hidden: !permissions.canCreateDocument,
          },
          {
            icon: IconFolder,
            label: "Create a new folder",
            action: toggleShowAddFolder,
            testId: "new-folder",
            hidden: !permissions.canCreateFolder,
          },
          {
            icon: IconUpload,
            label: "Upload files",
            action: showAddFilePopUp,
            testId: "upload-files",
            hidden: !permissions.canCreateFile,
          },
        ]}
        testId="add-options"
      />
    </div>
  );
}
