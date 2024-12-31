import React from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useDeleteResourceHubLink } from "@/models/resourceHubs";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Options() {
  const { link } = useLoadedData();
  assertPresent(link.permissions, "permissions must be present in link");

  return (
    <PageOptions.Root testId="options-button" position="top-right">
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
      navigate(Paths.resourceHubFolderPath(link.parentFolder.id!));
    } else {
      assertPresent(link.resourceHub, "resourceHub must be present in link");
      navigate(Paths.resourceHubPath(link.resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ linkId: link.id });
    redirect();
  };

  return <PageOptions.Action icon={Icons.IconTrash} title="Delete" onClick={handleDelete} testId="delete-link" />;
}
