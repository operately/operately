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

export function Form({ folderId }: { folderId: string | null }) {
  const { resourceHub } = useLoadedData();
  const navigate = useNavigate();
  const [post] = useCreateResourceHubDocument();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptions(resourceHub.potentialSubscribers, {
    ignoreMe: true,
  });

  const form = Forms.useForm({
    fields: {
      title: "",
      content: null,
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
      navigate(Paths.resourceHubPath(resourceHub.id!));
    },
    submit: async () => {
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folderId,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: resourceHub.id! } as const;

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
        <Spacer size={4} />
        <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />

        <Forms.Submit saveText="Submit" buttonSize="base" />
      </DimmedSection>
    </Forms.Form>
  );
}
