import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { IconFile, IconFolder } from "@tabler/icons-react";
import { OptionsButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { AddFolderModal } from "./AddFolderModal";
import { AddFileModal, useAddFile } from "./AddFiles";

interface Props {
  resourceHub: ResourceHub;
  refresh: () => void;
  folder?: ResourceHubFolder;
}

export function AddFilesButtonAndForms({ resourceHub, refresh, folder }: Props) {
  const navigate = useNavigate();
  const [showAddFolder, setShowAddFolder] = useState(false);
  const fileProps = useAddFile();

  const toggleShowAddFolder = () => setShowAddFolder(!showAddFolder);
  const navigateToNewDocument = () =>
    navigate(Paths.resourceHubNewDocumentPath(resourceHub.id!, folder?.id || undefined));

  return (
    <>
      <div className="w-min mt-2">
        <OptionsButton
          align="start"
          options={[
            { icon: IconFile, label: "Write a new document", action: navigateToNewDocument, testId: "new-document" },
            { icon: IconFolder, label: "Create a new folder", action: toggleShowAddFolder, testId: "new-folder" },
          ]}
          testId="add-options"
        />
      </div>

      <AddFolderModal
        resourceHub={resourceHub}
        showForm={showAddFolder}
        toggleForm={toggleShowAddFolder}
        refresh={refresh}
        folderId={folder?.id || undefined}
      />

      <AddFileModal resourceHub={resourceHub} folder={folder} refresh={refresh} {...fileProps} />
    </>
  );
}
