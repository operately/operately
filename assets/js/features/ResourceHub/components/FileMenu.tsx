import React from "react";

import * as Hub from "@/models/resourceHubs";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";

interface FileMenuProps {
  permissions: Hub.ResourceHubPermissions;
  refetch: () => void;
  file: Hub.ResourceHubFile;
}

export function FileMenu({ file, permissions, refetch }: FileMenuProps) {
  const relevantPermissions = [permissions.canDeleteFile];
  const menuId = createTestId("file-menu", file.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <Menu size="medium" testId={menuId}>
      {permissions.canDeleteFile && <DeleteFileMenuItem file={file} refetch={refetch} />}
    </Menu>
  );
}

function DeleteFileMenuItem({ file, refetch }: { file: Hub.ResourceHubFile; refetch: () => void }) {
  const [remove] = Hub.useDeleteResourceHubFile();
  const handleDelete = async () => {
    await remove({ fileId: file.id });
    refetch();
  };
  const deleteId = createTestId("delete", file.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete file
    </MenuActionItem>
  );
}
