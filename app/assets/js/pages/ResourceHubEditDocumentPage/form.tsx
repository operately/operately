import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHubDocument, useEditResourceHubDocument, usePublishResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { useFormContext } from "@/components/Forms/FormContext";

import { usePaths } from "@/routes/paths";
import { areRichTextObjectsEqual } from "turboui";
import { DimmedSection } from "@/components/PaperContainer";
import { Spacer } from "@/components/Spacer";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";

export function Form({ document }: { document: ResourceHubDocument }) {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = useEditResourceHubDocument();
  const [publish] = usePublishResourceHubDocument();

  const isDraft = document.state === "draft";

  if (isDraft) {
    assertPresent(document.potentialSubscribers, "potentialSubscribers must be present in document");
    assertPresent(document.subscriptionList, "subscriptionList must be present in document");
    assertPresent(document.resourceHub, "resourceHub must be present in document");
  }

  const subscriptionsState = useSubscriptions(document.potentialSubscribers ?? [], {
    ignoreMe: true,
    sendNotificationsToEveryone: document.subscriptionList?.sendToEveryone ?? undefined,
  });

  const initialSubscriptionTypeRef = React.useRef<Options | null>(null);
  const initialSubscriberIdsRef = React.useRef<string[] | null>(null);

  if (initialSubscriptionTypeRef.current === null) {
    initialSubscriptionTypeRef.current = subscriptionsState.subscriptionType;
  }

  if (initialSubscriberIdsRef.current === null) {
    initialSubscriberIdsRef.current = [...subscriptionsState.currentSubscribersList];
  }

  const form = Forms.useForm({
    fields: {
      title: document.name!,
      content: JSON.parse(document.content!),
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.content) {
        addError("content", "Content is required");
      }
    },
    cancel: () => navigate(paths.resourceHubDocumentPath(document.id!)),
    submit: async (type: "save" | "publish-draft") => {
      const { title, content } = form.values;
      const serializedContent = JSON.stringify(content);
      const subscriptionPayload = isDraft
        ? {
            sendNotificationsToEveryone: subscriptionsState.subscriptionType === Options.ALL,
            subscriberIds: subscriptionsState.currentSubscribersList,
          }
        : null;
      const subscriptionsChanged =
        isDraft &&
        (initialSubscriptionTypeRef.current !== subscriptionsState.subscriptionType ||
          !areIdListsEqual(initialSubscriberIdsRef.current, subscriptionsState.currentSubscribersList));

      if (type === "save") {
        if (documentHasChanged(document, title, content) || subscriptionsChanged) {
          await edit({
            documentId: document.id,
            name: title,
            content: serializedContent,
            ...(subscriptionPayload ? subscriptionPayload : {}),
          });
        }
      } else if (type === "publish-draft") {
        await publish({
          documentId: document.id,
          name: title,
          content: serializedContent,
          ...(subscriptionPayload ? subscriptionPayload : {}),
        });
      }

      navigate(paths.resourceHubDocumentPath(document.id!));
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

      {isDraft ? (
        <DimmedSection>
          <Spacer size={4} />
          <SubscribersSelector state={subscriptionsState} resourceHubName={document.resourceHub!.name!} />

          <FormActions document={document} />
        </DimmedSection>
      ) : (
        <FormActions document={document} />
      )}
    </Forms.Form>
  );
}

function FormActions({ document }: { document: ResourceHubDocument }) {
  const form = useFormContext();

  return (
    <div className="flex items-center justify-start gap-4 mt-8">
      <Forms.SubmitButton
        name="submit"
        text="Save Changes"
        buttonSize="base"
        primary
        onClick={() => form.actions.submit("save")}
      />
      {document.state === "draft" && (
        <Forms.SubmitButton
          name="publish-draft"
          text="Publish Now"
          buttonSize="base"
          onClick={() => form.actions.submit("publish-draft")}
        />
      )}
      <Forms.SubmitButton name="cancel" text="Cancel" buttonSize="base" onClick={() => form.actions.cancel()} />
    </div>
  );
}

function documentHasChanged(document: ResourceHubDocument, name: string, content: any) {
  if (document.name !== name) return true;
  if (!areRichTextObjectsEqual(JSON.parse(document.content!), content)) return true;
  return false;
}

function areIdListsEqual(initialIds: string[] | null, currentIds: string[]) {
  if (!initialIds) return currentIds.length === 0;
  if (initialIds.length !== currentIds.length) return false;

  const sortedInitial = [...initialIds].sort();
  const sortedCurrent = [...currentIds].sort();

  return sortedInitial.every((id, index) => id === sortedCurrent[index]);
}
