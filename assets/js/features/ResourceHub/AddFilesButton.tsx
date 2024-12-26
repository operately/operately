import React from "react";

import { IconFile, IconFolder, IconLink, IconUpload } from "@tabler/icons-react";
import { ResourceHubPermissions } from "@/models/resourceHubs";
import { OptionsButton } from "@/components/Buttons";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function AddFilesButton({ permissions }: { permissions: ResourceHubPermissions }) {
  const { navigateToNewDocument, navigateToNewLink, toggleShowAddFolder, showAddFilePopUp } = useNewFileModalsContext();

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
          {
            element: <div className="text-sm text-center">Or link to files from:</div>,
            hidden: !permissions.canCreateLink,
          },
          {
            icon: IconLink,
            label: "Any external resource",
            action: navigateToNewLink,
            testId: "link-to-external-resources",
            hidden: !permissions.canCreateLink,
          },
        ]}
        testId="add-options"
      />
    </div>
  );
}
