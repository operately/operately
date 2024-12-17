import React from "react";

import * as Hub from "@/models/resourceHubs";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";

interface Props {
  document: Hub.ResourceHubDocument;
}

export function DocumentMenu({ document }: Props) {
  const { permissions } = useNodesContext();
  const editPath = Paths.resourceHubEditDocumentPath(document.id!);
  const relevantPermissions = [permissions.canEditDocument, permissions.canDeleteDocument];

  const menuId = createTestId("document-menu", document.id!);
  const editId = createTestId("edit", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditDocument && (
          <MenuLinkItem to={editPath} testId={editId}>
            Edit
          </MenuLinkItem>
        )}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={document} />}
        {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} />}
      </Menu>

      <MoveResourceModal resource={document} resourceType="document" />
    </>
  );
}

function DeleteDocumentMenuItem({ document }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubDocument();

  const handleDelete = async () => {
    await remove({ documentId: document.id });
    refetch();
  };
  const deleteId = createTestId("delete", document.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
