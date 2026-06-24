import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHub, ResourceHubFolder, documents, resourceHubLandingPath } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { useFormContext } from "@/components/Forms/FormContext";
import { DimmedSection } from "@/components/PaperContainer";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Link, Spacer, SubscribersSelector } from "turboui";

import { useLoadedData } from "./loader";

export function Form() {
  const { resourceHub, folder } = useLoadedData();
  const navigate = useNavigate();
  const [post] = documents.useCreate();
  const paths = usePaths();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptionsAdapter(resourceHub.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub.name,
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
        folderId: folder?.id,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
        postAsDraft: isDraft,
      });
      navigate(paths.resourceHubDocumentPath(res.document.id));
    },
  });
  form.actions.setState;

  const mentionSearchScope = { type: "resource_hub", id: resourceHub.id! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TitleInput field="title" placeholder="Title..." autoFocus />

        <Forms.RichTextArea
          field="content"
          mentionSearchScope={mentionSearchScope}
          placeholder="Write here..."
          hideBorder
          showToolbarTopBorder
          fontSize="text-lg"
          horizontalPadding="px-0"
          verticalPadding="pt-2"
        />
      </Forms.FieldGroup>

      <DimmedSection>
        <Spacer size={4} />
        <SubscribersSelector {...subscriptionsState} />

        <FormActions resourceHub={resourceHub} />
      </DimmedSection>
    </Forms.Form>
  );
}

function FormActions({ resourceHub }: { resourceHub: ResourceHub }) {
  const { folder } = useLoadedData();
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
        Or, <DiscardLink resourceHub={resourceHub} folder={folder} />
      </div>
    </div>
  );
}

function DiscardLink({ resourceHub, folder }: { resourceHub: ResourceHub; folder?: ResourceHubFolder }) {
  const paths = usePaths();
  const path = folder ? paths.resourceHubFolderPath(folder.id!) : resourceHubLandingPath(paths, resourceHub);

  return (
    <Link to={path} testId="discard" className="font-medium">
      Discard this document
    </Link>
  );
}
