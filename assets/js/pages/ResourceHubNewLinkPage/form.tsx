import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateResourceHubLink } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { useFieldValue } from "@/components/Forms/FormContext";
import { DimmedSection } from "@/components/PaperContainer";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { isValidURL } from "@/utils/validators";
import { LinkOptions, LinkIcon } from "@/features/ResourceHub";

import { useLoadedData } from "./loader";

interface Props {
  folderId: string | null;
  type: LinkOptions | null;
}

export function Form({ folderId, type }: Props) {
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
      type: type,
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
      const res = await post({
        resourceHubId: resourceHub.id,
        folderId: folderId,
        name: form.values.title,
        url: form.values.link,
        type: form.values.type || "other",
        description: JSON.stringify(form.values.description),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType === Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      navigate(Paths.resourceHubLinkPath(res.link.id));
    },
  });

  return (
    <Forms.Form form={form}>
      {type ? (
        <div className="grid grid-cols-[150px,1fr]">
          <div className="pt-8">
            <LinkIcon type={form.values.type!} size={100} />
          </div>
          <FormFields />
        </div>
      ) : (
        <FormFields />
      )}

      <DimmedSection>
        <SubscribersSelector state={subscriptionsState} resourceHubName={resourceHub.name!} />

        <Forms.Submit saveText="Submit" buttonSize="base" />
      </DimmedSection>
    </Forms.Form>
  );
}

function FormFields() {
  const { resourceHub } = useLoadedData();
  const mentionSearchScope = { type: "resource_hub", id: resourceHub.id! } as const;

  return (
    <Forms.FieldGroup>
      <Forms.TextInput
        label="What do you want to call this link?"
        placeholder="Type the title of this link"
        field="title"
      />

      <Forms.TextInput label="Paste the link" placeholder="eg. https://www.example.com/file/8430762" field="link" />

      <SelectTypeField />

      <Forms.RichTextArea
        label="Notes (optional)"
        field="description"
        mentionSearchScope={mentionSearchScope}
        placeholder="Add any notes here..."
      />
    </Forms.FieldGroup>
  );
}

function SelectTypeField() {
  const [type, _] = useFieldValue<LinkOptions>("type");
  const isGoogleOption = useMemo(() => GOOGLE_OPTIONS.map((x) => x.value).includes(type), [type]);

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
