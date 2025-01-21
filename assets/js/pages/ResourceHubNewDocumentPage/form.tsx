import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHub, useCreateResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { useFormContext } from "@/components/Forms/FormContext";
import { Link } from "@/components/Link";
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
    submit: async (isDraft?: boolean) => {
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folderId,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType === Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
        postAsDraft: isDraft,
      });
      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });
  form.actions.setState;

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

        <FormActions resourceHub={resourceHub} />
      </DimmedSection>
    </Forms.Form>
  );
}

function FormActions({ resourceHub }: { resourceHub: ResourceHub }) {
  const form = useFormContext();

  return (
    <div>
      <div className="flex items-center justify-start gap-4 mt-8">
        <Forms.SubmitButton
          name="submit"
          text="Create document"
          buttonSize="base"
          primary
          onClick={() => form.actions.submit(false)}
        />
        <Forms.SubmitButton
          name="save-as-draft"
          text="Save as draft"
          buttonSize="base"
          onClick={() => form.actions.submit(true)}
        />
      </div>

      <div className="mt-4">
        Or, <DiscardLink resourceHubId={resourceHub.id!} />
      </div>
    </div>
  );
}

function DiscardLink({ resourceHubId }: { resourceHubId: string }) {
  return (
    <Link to={Paths.resourceHubPath(resourceHubId)} testId="discard" className="font-medium">
      Discard this document
    </Link>
  );
}
