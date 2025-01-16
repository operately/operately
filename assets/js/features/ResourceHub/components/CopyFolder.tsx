import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHubFolder, useCopyResourceHubFolder } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useNodesContext } from "../contexts/NodesContext";
import { CopyResourceModal } from "./CopyResource";

interface FormProps {
  resource: ResourceHubFolder;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyFolderModal(props: FormProps) {
  const { resource, hideModal } = props;
  const { parent } = useNodesContext();

  const [post] = useCopyResourceHubFolder();
  const navigate = useNavigate();

  assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");

  const form = Forms.useForm({
    fields: {
      name: resource.name + " - Copy",
      location: {
        id: parent?.id,
        type: "pathToFolder" in parent ? "folder" : "resourceHub",
      },
    },
    cancel: hideModal,
    submit: async () => {
      const res = await post({
        folderId: resource.id,
        destResourceHubId: resource.resourceHubId,
        destParentFolderId: form.values.location.type == "folder" ? form.values.location.id : undefined,
      });

      navigate(Paths.resourceHubFolderPath(res.folderId));
    },
  });

  return <CopyResourceModal form={form} {...props} />;
}
