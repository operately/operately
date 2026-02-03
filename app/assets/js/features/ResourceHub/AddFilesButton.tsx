import * as React from "react";
import * as Pages from "@/components/Pages";

import { ResourceHubPermissions } from "@/models/resourceHubs";

import { Airtable, Dropbox, Figma, GoogleLogo, Notion } from "@/components/Brands";
import { MenuActionItem, SubMenu, IconFile, IconFolderFilled, IconUpload, PrimaryButton, IconLink } from "turboui";

import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function AddFilesButton({ permissions }: { permissions: ResourceHubPermissions }) {
  const breakpoint = Pages.useWindowSizeBreakpoints();
  const options = Options({ permissions });
  const size = breakpoint === "xs" ? "xs" : "sm";

  return (
    <PrimaryButton size={size} optionsAlign="start" options={options} testId="add-options">
      Add
    </PrimaryButton>
  );
}

function Options({ permissions }: { permissions: ResourceHubPermissions }) {
  const { navigateToNewDocument, toggleShowAddFolder, selectFiles } = useNewFileModalsContext();

  return [
    <MenuActionItem
      key={1}
      icon={IconFile}
      onClick={navigateToNewDocument}
      testId="new-document"
      hidden={!permissions.canCreateDocument}
      children="New document"
    />,
    <MenuActionItem
      key={2}
      icon={IconFolderFilled}
      onClick={toggleShowAddFolder}
      testId="new-folder"
      hidden={!permissions.canCreateFolder}
      children="New folder"
    />,
    <MenuActionItem
      key={3}
      icon={IconUpload}
      onClick={selectFiles}
      testId="upload-files"
      hidden={!permissions.canCreateFile}
      children="Upload files"
    />,
    <NewLinkSubMenu key={4} hidden={!permissions.canCreateLink} />,
  ];
}

function NewLinkSubMenu({ hidden }: { hidden: boolean }) {
  const { navigateToNewLink } = useNewFileModalsContext();

  if (hidden) return null;

  return (
    <SubMenu label="Add link" icon={IconLink}>
      <MenuActionItem
        onClick={() => navigateToNewLink("airtable")}
        testId="link-to-airtable"
        icon={Airtable}
        children="Airtable"
      />
      <MenuActionItem
        onClick={() => navigateToNewLink("dropbox")}
        testId="link-to-dropbox"
        icon={Dropbox}
        children="Dropbox"
      />
      <MenuActionItem onClick={() => navigateToNewLink("figma")} testId="link-to-figma" icon={Figma} children="Figma" />
      <MenuActionItem
        onClick={() => navigateToNewLink("google_doc")}
        testId="link-to-google-drive"
        icon={GoogleLogo}
        children="Google Drive"
      />
      <MenuActionItem
        onClick={() => navigateToNewLink("notion")}
        testId="link-to-notion"
        icon={Notion}
        children="Notion"
      />
      <MenuActionItem
        onClick={() => navigateToNewLink()}
        testId="link-to-other-resource"
        icon={IconLink}
        children="Other"
      />
    </SubMenu>
  );
}
