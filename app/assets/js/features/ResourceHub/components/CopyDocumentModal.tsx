import React from "react";

import Forms from "@/components/Forms";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import * as Hub from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";
import { useNavigate } from "react-router-dom";
import { CopyResourceModal } from "./CopyResource";

import { usePaths } from "@/routes/paths";
interface FormProps {
  resource: Hub.ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
  parent: Hub.ResourceHub | Hub.ResourceHubFolder;
}

export function CopyDocumentModal(props: FormProps) {
  const paths = usePaths();
  const { parent, resource, hideModal } = props;

  const [post] = Hub.useCreateResourceHubDocument();
  const navigate = useNavigate();

  assertPresent(parent?.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");
  assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");

  const subscriptionsState = useSubscriptionsAdapter(parent.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: parent.name || "",
  });

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
        resourceHubId: resource.resourceHubId,
        folderId: form.values.location.type == "folder" ? form.values.location.id : undefined,
        name: form.values.name,
        content: resource.content,
        sendNotificationsToEveryone: true,
        subscriberIds: subscriptionsState.currentSubscribersList,
        copiedDocumentId: resource.id,
      });

      navigate(paths.resourceHubDocumentPath(res.document.id));
    },
  });

  return <CopyResourceModal form={form} {...props} />;
}
