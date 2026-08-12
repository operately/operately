import React from "react";
import { useNavigate } from "react-router";

import { Page } from "../Page";
import * as Forms from "../Forms";
import { areRichTextObjectsEqual } from "../RichContent/contentOps";
import { isValidURL } from "../utils/url";

import type { LinkEditPage as LinkEditPageNS } from "./types";

export function LinkEditPage(props: LinkEditPageNS.Props) {
  const navigate = useNavigate();

  const form = Forms.useForm<LinkEditPageNS.Values>({
    fields: {
      title: props.initialTitle,
      url: props.initialUrl,
      description: props.initialDescription,
    },
    validate: (addError) => {
      if (!form.values.title.trim()) {
        addError("title", "Title is required");
      }
      if (!form.values.url.trim()) {
        addError("url", "Link is required");
      }
      if (!isValidURL(form.values.url)) {
        addError("url", "Invalid link");
      }
    },
    cancel: () => navigate(props.cancelLink),
    submit: async () => {
      const contentChanged = hasContentChanged(
        props.initialTitle,
        props.initialUrl,
        props.initialDescription,
        form.values,
      );
      await props.onSubmit(form.values, { contentChanged });
    },
  });

  return (
    <Page title={props.pageTitle} size="medium" navigation={props.navigation} testId={props.testId ?? "link-edit-page"}>
      <Forms.Form form={form}>
        <div className="px-12 py-10">
          <Forms.FieldGroup>
            <Forms.TextInput
              autoFocus
              label="What do you want to call this link?"
              placeholder="Type the title of this link"
              field="title"
            />

            <Forms.TextInput label="Paste the link" placeholder="eg. https://www.example.com/file/8430762" field="url" />

            <Forms.RichTextArea
              label="Notes (optional)"
              field="description"
              richTextHandlers={props.richTextHandlers}
              placeholder="Add any notes here..."
            />
          </Forms.FieldGroup>

          <Forms.Submit saveText={props.submitLabel ?? "Save"} buttonSize="base" />
        </div>
      </Forms.Form>
    </Page>
  );
}

function hasContentChanged(
  initialTitle: string,
  initialUrl: string,
  initialDescription: unknown,
  values: LinkEditPageNS.Values,
) {
  if (initialTitle !== values.title) return true;
  if (initialUrl !== values.url) return true;
  if (!areRichTextObjectsEqual(initialDescription, values.description)) return true;
  return false;
}
