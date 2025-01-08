import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import { ResourceHubPermissions } from "@/models/resourceHubs";

import { Airtable, Dropbox, Figma, GoogleLogo, Notion } from "@/components/Brands";
import { PrimaryButton } from "@/components/Buttons";
import { MenuActionItem, SubMenu } from "@/components/Menu";

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
  const { navigateToNewDocument, toggleShowAddFolder, showAddFilePopUp } = useNewFileModalsContext();

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
    <NewLinkSubMenu permissions={permissions} />,
  ];
}

function NewLinkSubMenu({ permissions }: { permissions: ResourceHubPermissions }) {
  const { navigateToNewLink } = useNewFileModalsContext();

  if (!permissions.canCreateLink) return <></>;

  return (
    <SubMenu label="Add link" icon={Icons.IconLink}>
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
        icon={Icons.IconLink}
        children="Other"
      />
    </SubMenu>
  );
}
