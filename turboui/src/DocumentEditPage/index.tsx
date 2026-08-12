import React from "react";
import { useNavigate } from "react-router";

import { Page } from "../Page";
import { PageFooter } from "../Page/PageFooter";
import * as Forms from "../Forms";
import { isContentEmpty } from "../RichContent";
import { areRichTextObjectsEqual } from "../RichContent/contentOps";
import { Spacer } from "../Spacer";
import { SubscribersSelector } from "../Subscriptions";

import type { DocumentEditPage as DocumentEditPageNS } from "./types";

export function DocumentEditPage(props: DocumentEditPageNS.Props) {
  const navigate = useNavigate();

  const form = Forms.useForm<DocumentEditPageNS.Values>({
    fields: {
      title: props.initialTitle,
      content: props.initialContent,
    },
    validate: (addError) => {
      if (!form.values.title.trim()) {
        addError("title", "Title is required");
      }
      if (isContentEmpty(form.values.content)) {
        addError("content", "Content is required");
      }
    },
    cancel: () => navigate(props.cancelLink),
    submit: async (action: "save" | "publish-draft" = "save") => {
      const contentChanged = hasContentChanged(props.initialTitle, props.initialContent, form.values);
      await props.onSubmit(form.values, { action, contentChanged });
    },
  });

  return (
    <Page title={props.pageTitle} size="medium" navigation={props.navigation} testId={props.testId ?? "document-edit-page"}>
      <Forms.Form form={form}>
        <div className="px-12 py-10">
          <Forms.FieldGroup>
            <Forms.TitleInput field="title" placeholder="Title..." />

            <Forms.RichTextArea
              field="content"
              richTextHandlers={props.richTextHandlers}
              placeholder="Write here..."
              hideBorder
              showToolbarTopBorder
              fontSize="text-lg"
              horizontalPadding="px-0"
              verticalPadding="pt-2"
            />
          </Forms.FieldGroup>
        </div>

        <PageFooter className="px-12 py-10">
          <Spacer size={4} />
          {!props.hideSubscriptions && <SubscribersSelector {...props.subscriptions} />}

          <FormActions hidePublishAction={Boolean(props.hidePublishAction)} />
        </PageFooter>
      </Forms.Form>
    </Page>
  );
}

function FormActions({ hidePublishAction }: { hidePublishAction: boolean }) {
  const form = Forms.useFormContext();

  return (
    <div className="flex items-center justify-start gap-4 mt-8">
      <Forms.SubmitButton
        name="submit"
        text="Save Changes"
        buttonSize="base"
        primary
        onClick={() => form.actions.submit("save")}
      />
      {!hidePublishAction && (
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

function hasContentChanged(initialTitle: string, initialContent: unknown, values: DocumentEditPageNS.Values) {
  if (initialTitle !== values.title) return true;
  if (!areRichTextObjectsEqual(initialContent, values.content)) return true;
  return false;
}
