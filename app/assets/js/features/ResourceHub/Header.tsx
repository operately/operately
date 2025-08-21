import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import * as Pages from "@/components/Pages";
import { ResourceHub, ResourceHubFolder, useRenameResourceHubFolder } from "@/models/resourceHubs";
import { TextField } from "turboui";
import { usePaperSizeHelpers } from "@/components/PaperContainer";
import classNames from "classnames";

interface Props {
  resource: ResourceHub | ResourceHubFolder;
}

export function Header({ resource }: Props) {
  // Check if this is a folder that can be renamed
  const isFolder = (resource as ResourceHubFolder).type === "folder";
  const canRename = isFolder && resource.permissions?.canRenameFolder;

  if (canRename) {
    return <EditableHeader resource={resource as ResourceHubFolder} />;
  }

  return (
    <Paper.Header
      actions={<Hub.AddFilesButton permissions={resource.permissions!} />}
      title={resource.name!}
      layout="title-center-actions-left"
      underline
    />
  );
}

function EditableHeader({ resource }: { resource: ResourceHubFolder }) {
  const [rename] = useRenameResourceHubFolder();
  const { negHor, negTop } = usePaperSizeHelpers();
  // Get refresh function to update the folder data after rename
  const refresh = Pages.useRefresh();

  const handleRename = (newName: string): void => {
    if (newName !== resource.name && newName.trim()) {
      rename({
        folderId: resource.id,
        newName: newName.trim(),
      })
      .then(() => {
        // Refresh the folder data to get updated name
        refresh();
      })
      .catch((error) => {
        console.error("Failed to rename folder:", error);
      });
    }
  };

  const className = classNames("flex items-center justify-between", {
    "mb-6": true,
    "pt-5 pb-4": true,
    "border-b border-stroke-base": true,
    [negHor]: true,
    [negTop]: true,
    "px-4 sm:px-8": true,
  });

  return (
    <div className={className}>
      <div className="w-1/4">
        <Hub.AddFilesButton permissions={resource.permissions!} />
      </div>

      <div className="w-2/4 text-center flex-1">
        <TextField
          text={resource.name!}
          onChange={handleRename}
          className="text-content-accent text-lg md:text-2xl font-extrabold"
          testId="folder-name-field"
          trimBeforeSave
        />
      </div>

      <div className="w-1/4" />
    </div>
  );
}
