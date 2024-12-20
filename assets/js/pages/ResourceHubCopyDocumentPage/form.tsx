import React from "react";
import { useNavigate } from "react-router-dom";

import { useCreateResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { DimmedSection } from "@/components/PaperContainer";
import { Spacer } from "@/components/Spacer";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { FolderSelectField } from "@/features/ResourceHub";

export function Form() {
  const { resourceHub, folder, document } = useLoadedData();
  const parent = folder || resourceHub;

  const navigate = useNavigate();
  const [post] = useCreateResourceHubDocument();

  assertPresent(parent?.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");

  const subscriptionsState = useSubscriptions(parent.potentialSubscribers, {
    ignoreMe: true,
  });

  const form = Forms.useForm({
    fields: {
      title: document.name,
      content: JSON.parse(document.content!),
      folderId: document.parentFolderId,
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.content) {
        addError("content", "Content is required");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubDocumentPath(document.id!));
    },
    submit: async () => {
      const res = await post({
        resourceHubId: document.resourceHubId,
        folderId: form.values.folderId,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
        copiedDocumentId: document.id,
      });
      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: document.resourceHubId! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TitleInput field="title" placeholder="Title..." />

        <Forms.RichTextArea
          field="content"
          mentionSearchScope={mentionSearchScope}
          placeholder="Write here..."
          hideBorder
        />
      </Forms.FieldGroup>

      <DimmedSection>
        <FolderSelectField field="folderId" resource={document} startLocation={parent} />
        <Spacer size={2} />
        <SubscribersSelector state={subscriptionsState} resourceHubName={parent.name!} />

        <Forms.Submit saveText="Copy" buttonSize="base" />
      </DimmedSection>
    </Forms.Form>
  );
}
