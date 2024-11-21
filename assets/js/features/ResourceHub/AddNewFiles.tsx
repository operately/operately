import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHub } from "@/models/resourceHubs";
import { IconFile, IconFolder, IconUpload } from "@tabler/icons-react";
import { OptionsButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { AddFolderModal } from "./AddFolderModal";
import { AddFileModal, useAddFile } from "./AddFiles";

interface Props {
  resourceHub: ResourceHub;
  refresh: () => void;
  folderId?: string;
}

export function AddFilesButtonAndForms({ resourceHub, refresh, folderId }: Props) {
  const navigate = useNavigate();
  const [showAddFolder, setShowAddFolder] = useState(false);
  const fileProps = useAddFile();

  const toggleShowAddFolder = () => setShowAddFolder(!showAddFolder);
  const navigateToNewDocument = () => navigate(Paths.resourceHubNewDocumentPath(resourceHub.id!, folderId));

  return (
    <>
      <div className="w-min mt-2">
        <OptionsButton
          align="start"
          options={[
            { icon: IconFile, label: "Write a new document", action: navigateToNewDocument, testId: "new-document" },
            { icon: IconFolder, label: "Create a new folder", action: toggleShowAddFolder, testId: "new-folder" },
            { icon: IconUpload, label: "Upload files", action: fileProps.showAddFilePopUp, testId: "upload-files" },
          ]}
          testId="add-options"
        />
      </div>

      <AddFolderModal
        resourceHub={resourceHub}
        showForm={showAddFolder}
        toggleForm={toggleShowAddFolder}
        refresh={refresh}
        folderId={folderId}
      />

      <AddFileModal {...fileProps} />
    </>
  );
}
