import React from "react";

import { DimmedLink } from "../Link";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import * as Forms from "../Forms";
import { emptyContent } from "../RichContent/contentOps";
import { isContentEmpty } from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";

export namespace TemplateDiscussionForm {
  export interface Values extends Record<string, unknown> {
    title: string;
    body: unknown;
  }

  export interface Props {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    initialValues?: Partial<Values>;
    richTextHandlers: RichEditorHandlers;
    cancelLink: string;
    submitLabel: string;
    onSubmit: (values: Values) => Promise<boolean>;
  }
}

export function TemplateDiscussionForm(props: TemplateDiscussionForm.Props) {
  const form = Forms.useForm<TemplateDiscussionForm.Values>({
    fields: {
      title: props.initialValues?.title ?? "",
      body: props.initialValues?.body ?? emptyContent(),
    },
    validate: (addError) => {
      if (!form.values.title.trim()) addError("title", "Please add a title");
      if (isContentEmpty(form.values.body)) addError("body", "Body is required");
    },
    submit: async () => {
      await props.onSubmit(form.values);
    },
  });

  return (
    <Page title={props.pageTitle} navigation={props.navigation} testId="template-discussion-form">
      <main className="px-8 py-6 sm:px-10 sm:py-8">
        <Forms.Form form={form}>
          <Forms.FieldGroup>
            <Forms.TitleInput field="title" placeholder="Title..." autoFocus testId="discussion-title" />
            <div className="mt-2 border-y border-stroke-base text-content-base font-medium">
              <Forms.RichTextArea
                field="body"
                richTextHandlers={props.richTextHandlers}
                placeholder="Start a new discussion..."
                hideBorder
                height="min-h-[350px]"
                fontSize="text-lg"
                horizontalPadding="px-0"
                verticalPadding="py-2"
              />
            </div>
          </Forms.FieldGroup>

          <Forms.FormError message="Fill out all the required fields" className="mt-4" />
          <div className="flex items-center gap-4 mt-4">
            <Forms.Submit
              saveText={props.submitLabel}
              buttonSize="base"
              testId="save-template-discussion"
              containerClassName="mt-0"
            />
            <DimmedLink to={props.cancelLink} className="inline-flex items-center">
              Cancel
            </DimmedLink>
          </div>
        </Forms.Form>
      </main>
    </Page>
  );
}
