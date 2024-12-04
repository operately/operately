import React from "react";

import * as Hub from "@/models/resourceHubs";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";

interface DocumentMenuProps {
  permissions: Hub.ResourceHubPermissions;
  refetch: () => void;
  document: Hub.ResourceHubDocument;
}

export function DocumentMenu({ document, permissions, refetch }: DocumentMenuProps) {
  const editPath = Paths.resourceHubEditDocumentPath(document.id!);
  const relevantPermissions = [permissions.canEditDocument, permissions.canDeleteDocument];

  const menuId = createTestId("document-menu", document.id!);
  const editId = createTestId("edit", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <Menu size="medium" testId={menuId}>
      {permissions.canEditDocument && (
        <MenuLinkItem to={editPath} testId={editId}>
          Edit document
        </MenuLinkItem>
      )}

      {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} refetch={refetch} />}
    </Menu>
  );
}

function DeleteDocumentMenuItem({ document, refetch }: { document: Hub.ResourceHubDocument; refetch: () => void }) {
  const [remove] = Hub.useDeleteResourceHubDocument();
  const handleDelete = async () => {
    await remove({ documentId: document.id });
    refetch();
  };
  const deleteId = createTestId("delete", document.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete document
    </MenuActionItem>
  );
}
