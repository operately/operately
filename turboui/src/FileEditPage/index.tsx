import React from "react";
import { useNavigate } from "react-router";

import { Page } from "../Page";
import * as Forms from "../Forms";
import { areRichTextObjectsEqual } from "../RichContent/contentOps";
import { findNameAndExtension } from "../ResourceHub/utils";

import type { FileEditPage as FileEditPageNS } from "./types";

export function FileEditPage(props: FileEditPageNS.Props) {
  const navigate = useNavigate();
  const { name, extension } = findNameAndExtension(props.initialTitle);

  const form = Forms.useForm<FileEditPageNS.Values>({
    fields: {
      title: name,
      description: props.initialDescription,
    },
    validate: (addError) => {
      if (!form.values.title.trim()) {
        addError("title", "Title is required");
      }
    },
    cancel: () => navigate(props.cancelLink),
    submit: async () => {
      const values = {
        title: withExtension(form.values.title, extension),
        description: form.values.description,
      };
      const contentChanged = hasContentChanged(props.initialTitle, props.initialDescription, values);
      await props.onSubmit(values, { contentChanged });
    },
  });

  return (
    <Page title={props.pageTitle} size="medium" navigation={props.navigation} testId={props.testId ?? "file-edit-page"}>
      <Forms.Form form={form}>
        <div className="px-12 py-10">
          <Forms.FieldGroup>
            <Forms.TitleInput field="title" placeholder="Title..." />
            <Forms.RichTextArea
              field="description"
              richTextHandlers={props.richTextHandlers}
              placeholder="Write here..."
              hideBorder
            />
          </Forms.FieldGroup>

          <Forms.Submit saveText={props.submitLabel ?? "Save"} buttonSize="base" />
        </div>
      </Forms.Form>
    </Page>
  );
}

function withExtension(title: string, extension: string) {
  return extension ? [title, extension].join(".") : title;
}

function hasContentChanged(initialTitle: string, initialDescription: unknown, values: FileEditPageNS.Values) {
  if (initialTitle !== values.title) return true;
  if (!areRichTextObjectsEqual(initialDescription, values.description)) return true;
  return false;
}
