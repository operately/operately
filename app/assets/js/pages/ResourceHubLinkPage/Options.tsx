import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { IconEdit, IconTrash } from "turboui";
import React from "react";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteModal: () => void;
}

export function Options({ showDeleteModal }: Props) {
  const { link } = useLoadedData();
  const paths = usePaths();
  assertPresent(link.permissions, "permissions must be present in link");

  return (
    <PageOptions.Root testId="options-button">
      {link.permissions.canEditLink && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.resourceHubEditLinkPath(link.id!)}
          testId="edit-link-link"
        />
      )}
      {link.permissions.canDeleteLink && <DeleteAction onClick={showDeleteModal} />}
    </PageOptions.Root>
  );
}

interface DeleteActionProps {
  onClick: () => void;
}

function DeleteAction({ onClick }: DeleteActionProps) {
  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={onClick} testId="delete-resource-link" />;
}
