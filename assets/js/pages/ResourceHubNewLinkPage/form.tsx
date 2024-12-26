import React from "react";
import { useNavigate } from "react-router-dom";

import { useCreateResourceHubLink } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { DimmedSection } from "@/components/PaperContainer";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { isValidURL } from "@/utils/validators";

import { useLoadedData } from "./loader";

export function Form({ folderId }: { folderId: string | null }) {
  const { resourceHub } = useLoadedData();
  const navigate = useNavigate();
  const [post] = useCreateResourceHubLink();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptions(resourceHub.potentialSubscribers, {
    ignoreMe: true,
  });

  const form = Forms.useForm({
    fields: {
      title: "",
      link: "",
      description: null,
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.link) {
        addError("link", "Link is required");
      }
      if (!isValidURL(form.values.link)) {
        addError("link", "Invalid link");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubPath(resourceHub.id!));
    },
    submit: async () => {
      await post({
        resourceHubId: resourceHub.id,
        folderId: folderId,
        name: form.values.title,
        url: form.values.link,
        type: "other",
        description: JSON.stringify(form.values.description),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType === Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigate(Paths.resourceHubPath(resourceHub.id!));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: resourceHub.id! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          label="What do you want to call this link?"
          placeholder="Type the title of this link"
          field="title"
        />

        <Forms.TextInput label="Paste the link" placeholder="eg. https://www.example.com/file/8430762" field="link" />

        <Forms.RichTextArea
          label="Notes (optional)"
          field="description"
          mentionSearchScope={mentionSearchScope}
          placeholder="Add any notes here..."
        />
      </Forms.FieldGroup>

      <DimmedSection>
        <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />

        <Forms.Submit saveText="Submit" buttonSize="base" />
      </DimmedSection>
    </Forms.Form>
  );
}
