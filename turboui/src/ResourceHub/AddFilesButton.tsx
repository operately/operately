import * as React from "react";

import { Airtable } from "../BrandIcons/Airtable";
import { Dropbox } from "../BrandIcons/Dropbox";
import { Figma } from "../BrandIcons/Figma";
import { GoogleLogo } from "../BrandIcons/GoogleLogo";
import { Notion } from "../BrandIcons/Notion";
import { IconFile, IconFolderFilled, IconLink, IconUpload } from "../icons";
import { MenuActionItem, SubMenu } from "../Menu";
import { PrimaryButton } from "../Button";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";
import type { ResourceHubLinkType, ResourceHubPermissions } from "./types";

interface AddFilesButtonProps {
  permissions?: ResourceHubPermissions | null;
  onNewDocument: () => void;
  onNewFolder: () => void;
  onUploadFiles: () => void;
  onNewLink: (type?: ResourceHubLinkType) => void;
}

export function AddFilesButton({
  permissions,
  onNewDocument,
  onNewFolder,
  onUploadFiles,
  onNewLink,
}: AddFilesButtonProps) {
  const breakpoint = useWindowSizeBreakpoints();
  const options = buildOptions({ permissions, onNewDocument, onNewFolder, onUploadFiles, onNewLink });
  const size = breakpoint === "xs" ? "xs" : "sm";

  return (
    <PrimaryButton size={size} optionsAlign="start" options={options} testId="add-options">
      Add
    </PrimaryButton>
  );
}

function buildOptions({
  permissions,
  onNewDocument,
  onNewFolder,
  onUploadFiles,
  onNewLink,
}: {
  permissions?: ResourceHubPermissions | null;
  onNewDocument: () => void;
  onNewFolder: () => void;
  onUploadFiles: () => void;
  onNewLink: (type?: ResourceHubLinkType) => void;
}) {
  return [
    <MenuActionItem
      key={1}
      icon={IconFile}
      onClick={onNewDocument}
      testId="new-document"
      hidden={!permissions?.canCreateDocument}
      children="New document"
    />,
    <MenuActionItem
      key={2}
      icon={IconFolderFilled}
      onClick={onNewFolder}
      testId="new-folder"
      hidden={!permissions?.canCreateFolder}
      children="New folder"
    />,
    <MenuActionItem
      key={3}
      icon={IconUpload}
      onClick={onUploadFiles}
      testId="upload-files"
      hidden={!permissions?.canCreateFile}
      children="Upload files"
    />,
    <NewLinkSubMenu key={4} hidden={!permissions?.canCreateLink} onNewLink={onNewLink} />,
  ];
}

function NewLinkSubMenu({ hidden, onNewLink }: { hidden: boolean; onNewLink: (type?: ResourceHubLinkType) => void }) {
  if (hidden) return null;

  return (
    <SubMenu label="Add link" icon={IconLink}>
      <MenuActionItem
        onClick={() => onNewLink("airtable")}
        testId="link-to-airtable"
        icon={Airtable}
        children="Airtable"
      />
      <MenuActionItem
        onClick={() => onNewLink("dropbox")}
        testId="link-to-dropbox"
        icon={Dropbox}
        children="Dropbox"
      />
      <MenuActionItem onClick={() => onNewLink("figma")} testId="link-to-figma" icon={Figma} children="Figma" />
      <MenuActionItem
        onClick={() => onNewLink("google_doc")}
        testId="link-to-google-drive"
        icon={GoogleLogo}
        children="Google Drive"
      />
      <MenuActionItem
        onClick={() => onNewLink("notion")}
        testId="link-to-notion"
        icon={Notion}
        children="Notion"
      />
      <MenuActionItem
        onClick={() => onNewLink()}
        testId="link-to-other-resource"
        icon={IconLink}
        children="Other"
      />
    </SubMenu>
  );
}
