import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { assertPresent } from "@/utils/assertions";
import { useDownloadFile } from "@/models/blobs";
import { Paths } from "@/routes/paths";

import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";
import { DecoratedNode } from "../DecoratedNode";

interface Props {
  node: DecoratedNode;
}

export function FileMenu({ node }: Props) {
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [
    node.permissions.canView,
    node.permissions.canEditParentFolder,
    node.permissions.canDeleteFile,
  ];

  const editPath = Paths.resourceHubEditFilePath(node.resource.id!);
  const menuId = createTestId("file-menu", node.resource.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {node.permissions.canView && <DownloadFileMenuItem node={node} />}
        {node.permissions.canEditFile && <MenuLinkItem to={editPath}>Edit</MenuLinkItem>}
        {node.permissions.canEditParentFolder && <MoveResourceMenuItem node={node} showModal={toggleMoveForm} />}
        {node.permissions.canDeleteFile && <DeleteFileMenuItem node={node} />}
      </Menu>

      <MoveResourceModal node={node} isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function DownloadFileMenuItem({ node }: Props) {
  const file = node.resource as Hub.ResourceHubFile;

  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.blob.filename, "blob.filename must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.blob.filename);

  return <MenuActionItem onClick={downloadFile}>Download</MenuActionItem>;
}

function DeleteFileMenuItem({ node }: Props) {
  const refresh = Pages.useRefresh();
  const [remove] = Hub.useDeleteResourceHubFile();

  const handleDelete = async () => {
    await remove({ fileId: node.resource.id });
    refresh();
  };

  const deleteId = createTestId("delete", node.resource.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
