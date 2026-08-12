import React, { useMemo } from "react";
import { useNavigate } from "react-router";

import { Page } from "../Page";
import * as Forms from "../Forms";
import { emptyContent } from "../RichContent/contentOps";
import { LinkIcon } from "../ResourceHub/LinkIcon";
import type { ResourceHubLinkType } from "../ResourceHub/types";
import { SubscribersSelector } from "../Subscriptions";
import { isValidURL } from "../utils/url";

import type { LinkNewPage as LinkNewPageNS } from "./types";

export function LinkNewPage(props: LinkNewPageNS.Props) {
  const navigate = useNavigate();

  const form = Forms.useForm<LinkNewPageNS.Values>({
    fields: {
      title: "",
      link: "",
      type: props.initialType,
      description: emptyContent(),
    },
    validate: (addError) => {
      if (!form.values.title.trim()) {
        addError("title", "Title is required");
      }
      if (!isValidURL(form.values.link)) {
        addError("link", "Invalid link");
      }
    },
    cancel: () => navigate(props.cancelLink),
    submit: async () => {
      await props.onSubmit(form.values);
    },
  });

  return (
    <Page title={props.pageTitle} size="medium" navigation={props.navigation} testId={props.testId ?? "link-new-page"}>
      <Forms.Form form={form}>
        <div className="px-12 py-10">
          <div className="grid grid-cols-[150px,1fr]">
            <div className="pt-8">
              <LinkIcon type={form.values.type} size={100} />
            </div>

            <div>
              <Forms.FieldGroup>
                <Forms.TextInput label="Link Title" placeholder="Type the title of this link" field="title" required />
                <Forms.TextInput label="URL" placeholder="eg. https://www.example.com/file/8430762" field="link" required />

                <SelectTypeField />

                <Forms.RichTextArea
                  label="Description (optional)"
                  field="description"
                  richTextHandlers={props.richTextHandlers}
                  placeholder="Add any notes here..."
                />
              </Forms.FieldGroup>

              <div className="mt-12">
                {!props.hideSubscriptions && <SubscribersSelector {...props.subscriptions} />}
                <Forms.Submit saveText={props.submitLabel ?? "Add link"} buttonSize="base" />
              </div>
            </div>
          </div>
        </div>
      </Forms.Form>
    </Page>
  );
}

function SelectTypeField() {
  const [type] = Forms.useFieldValue<ResourceHubLinkType>("type");
  const isGoogleOption = useMemo(() => type != null && GOOGLE_OPTIONS.some((option) => option.value === type), [type]);

  if (!isGoogleOption) return null;

  return (
    <Forms.RadioButtons
      label="What kind of document is this?"
      field="type"
      options={GOOGLE_OPTIONS}
      containerClass="flex items-center flex-wrap gap-8"
    />
  );
}

const GOOGLE_OPTIONS = [
  { label: "Doc", value: "google_doc" },
  { label: "Sheet", value: "google_sheet" },
  { label: "Slide", value: "google_slides" },
  { label: "Other", value: "google" },
];
