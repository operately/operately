import React, { useMemo } from "react";
import { useNavigate } from "react-router";

import { links, resourceHubLandingPath } from "@/models/resourceHubs";
import { Forms, emptyContent, LinkIcon, SubscribersSelector, type ResourceHubLinkType } from "turboui";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { isValidURL } from "@/utils/validators";

import { useLoadedData } from "./loader";

export function Form() {
  const { resourceHub, folder, linkType } = useLoadedData();
  const navigate = useNavigate();
  const [post] = links.useCreate();
  const paths = usePaths();

  assertPresent(resourceHub.potentialSubscribers, "potentialSubscribers must be present in resourceHub");

  const subscriptionsState = useSubscriptionsAdapter(resourceHub.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: resourceHub.name,
  });

  const form = Forms.useForm({
    fields: {
      title: "",
      link: "",
      type: linkType,
      description: emptyContent(),
    },
    validate: (addError) => {
      if (!isValidURL(form.values.link)) {
        addError("link", "Invalid link");
      }
    },
    cancel: () => {
      navigate(folder ? paths.resourceHubFolderPath(folder.id!) : resourceHubLandingPath(paths, resourceHub));
    },
    submit: async () => {
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folder?.id,
        name: form.values.title,
        url: form.values.link,
        type: form.values.type || "other",
        description: JSON.stringify(form.values.description),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigate(paths.resourceHubLinkPath(res.link.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <div className="grid grid-cols-[150px,1fr]">
        <div className="pt-8">
          <LinkIcon type={form.values.type!} size={100} />
        </div>

        <div>
          <FormFields />

          <div className="mt-12">
            <SubscribersSelector {...subscriptionsState} />
            <Forms.Submit saveText="Add link" buttonSize="base" />
          </div>
        </div>
      </div>
    </Forms.Form>
  );
}

function FormFields() {
  const { resourceHub } = useLoadedData();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: resourceHub.id! } });

  return (
    <Forms.FieldGroup>
      <Forms.TextInput label="Link Title" placeholder="Type the title of this link" field="title" required />
      <Forms.TextInput label="URL" placeholder="eg. https://www.example.com/file/8430762" field="link" required />

      <SelectTypeField />

      <Forms.RichTextArea
        label="Description (optional)"
        field="description"
        richTextHandlers={richTextHandlers}
        placeholder="Add any notes here..."
      />
    </Forms.FieldGroup>
  );
}

function SelectTypeField() {
  const [type, _] = Forms.useFieldValue<ResourceHubLinkType>("type");
  const isGoogleOption = useMemo(
    () => type != null && GOOGLE_OPTIONS.map((x) => x.value).includes(type),
    [type],
  );

  if (isGoogleOption) {
    return (
      <Forms.RadioButtons
        label="What kind of document is this?"
        field="type"
        options={GOOGLE_OPTIONS}
        containerClass="flex items-center flex-wrap gap-8"
      />
    );
  }
  return <></>;
}

const GOOGLE_OPTIONS = [
  { label: "Doc", value: "google_doc" },
  { label: "Sheet", value: "google_sheet" },
  { label: "Slide", value: "google_slides" },
  { label: "Other", value: "google" },
];
