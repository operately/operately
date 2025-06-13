import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Icons from "@tabler/icons-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteResourceHubLink } from "@/models/resourceHubs";

import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Options() {
  const { link } = useLoadedData();
  assertPresent(link.permissions, "permissions must be present in link");

  return (
    <PageOptions.Root testId="options-button">
      {link.permissions.canEditLink && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit"
          to={DeprecatedPaths.resourceHubEditLinkPath(link.id!)}
          testId="edit-link-link"
        />
      )}
      {link.permissions.canDeleteLink && <DeleteAction />}
    </PageOptions.Root>
  );
}

function DeleteAction() {
  const { link } = useLoadedData();
  const [remove] = useDeleteResourceHubLink();
  const navigate = useNavigate();

  const redirect = () => {
    if (link.parentFolder) {
      navigate(DeprecatedPaths.resourceHubFolderPath(link.parentFolder.id!));
    } else {
      assertPresent(link.resourceHub, "resourceHub must be present in link");
      navigate(DeprecatedPaths.resourceHubPath(link.resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ linkId: link.id });
    redirect();
  };

  return (
    <PageOptions.Action icon={Icons.IconTrash} title="Delete" onClick={handleDelete} testId="delete-resource-link" />
  );
}
