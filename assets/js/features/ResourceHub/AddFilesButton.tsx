import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ResourceHubPermissions } from "@/models/resourceHubs";
import { PrimaryButton } from "@/components/Buttons";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { MenuActionItem } from "@/components/Menu";

export function AddFilesButton({ permissions }: { permissions: ResourceHubPermissions }) {
  const options = Options({ permissions });

  return (
    <PrimaryButton size="sm" optionsAlign="start" options={options} testId="add-options">
      Add
    </PrimaryButton>
  );
}

function Options({ permissions }: { permissions: ResourceHubPermissions }) {
  const { navigateToNewDocument, navigateToNewLink, toggleShowAddFolder, showAddFilePopUp } = useNewFileModalsContext();

  return [
    <MenuActionItem
      icon={Icons.IconFile}
      onClick={navigateToNewDocument}
      testId="new-document"
      hidden={!permissions.canCreateDocument}
      children="New document"
    />,
    <MenuActionItem
      icon={Icons.IconFolderFilled}
      onClick={toggleShowAddFolder}
      testId="new-folder"
      hidden={!permissions.canCreateFolder}
      children="New folder"
    />,
    <MenuActionItem
      icon={Icons.IconUpload}
      onClick={showAddFilePopUp}
      testId="upload-files"
      hidden={!permissions.canCreateFile}
      children="Upload files"
    />,
    <MenuActionItem
      onClick={navigateToNewLink}
      testId="link-to-external-resources"
      hidden={!permissions.canCreateLink}
      icon={Icons.IconLink}
      children="Add link"
    />,
  ];
}
