import React from "react";

import { ResourceHubDocument, useCreateResourceHubDocument } from "@/models/resourceHubs";
import Forms from "@/components/Forms";
import { useNodesContext } from "../contexts/NodesContext";
import { useNavigate } from "react-router-dom";
import { assertPresent } from "@/utils/assertions";
import { useSubscriptions } from "@/features/Subscriptions";
import { Paths } from "@/routes/paths";
import { CopyResourceModal } from "./CopyResource";

interface FormProps {
  resource: ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyDocumentModal(props: FormProps) {
  const { resource, hideModal } = props;
  const { parent } = useNodesContext();

  const [post] = useCreateResourceHubDocument();
  const navigate = useNavigate();

  assertPresent(parent?.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");
  assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");

  const subscriptionsState = useSubscriptions(parent.potentialSubscribers, { ignoreMe: true });

  const form = Forms.useForm({
    fields: {
      name: resource.name + " - Copy",
      location: {
        id: parent?.id,
        type: "pathToFolder" in parent ? "folder" : "resourceHub",
      },
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: hideModal,
    submit: async () => {
      const res = await post({
        resourceHubId: resource.resourceHubId,
        folderId: form.values.location.type == "folder" ? form.values.location.id : undefined,
        name: form.values.name,
        content: resource.content,
        sendNotificationsToEveryone: true,
        subscriberIds: subscriptionsState.currentSubscribersList,
        copiedDocumentId: resource.id,
      });

      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });

  return <CopyResourceModal form={form} {...props} />;
}
