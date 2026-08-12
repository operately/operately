import React from "react";

import { Link } from "../Link";
import { Page } from "../Page";
import { PageFooter } from "../Page/PageFooter";
import type { Navigation } from "../Page/Navigation";
import * as Forms from "../Forms";
import { emptyContent } from "../RichContent/contentOps";
import { isContentEmpty } from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { Spacer } from "../Spacer";
import { SubscribersSelector } from "../Subscriptions";

export namespace NewDocumentPage {
  export interface Values extends Record<string, unknown> {
    title: string;
    content: unknown;
  }

  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    testId?: string;
    richTextHandlers: RichEditorHandlers;
    cancelLink: string;
    submitLabel?: string;
    onSubmit: (values: Values, meta: { isDraft: boolean }) => Promise<boolean>;
  }

  type WithSubscriptions = {
    subscriptions: SubscribersSelector.Props;
    hideSubscriptions?: never;
  };

  type WithoutSubscriptions = {
    hideSubscriptions: true;
    subscriptions?: never;
  };

  type WithDraftActions = {
    hideDraftActions?: never;
  };

  type WithoutDraftActions = {
    hideDraftActions: true;
  };

  export type Props = BaseProps & (WithSubscriptions | WithoutSubscriptions) & (WithDraftActions | WithoutDraftActions);
}

export function NewDocumentPage(props: NewDocumentPage.Props) {
  const form = Forms.useForm<NewDocumentPage.Values>({
    fields: {
      title: "",
      content: emptyContent(),
    },
    validate: (addError) => {
      if (!form.values.title.trim()) {
        addError("title", "Title is required");
      }
      if (isContentEmpty(form.values.content)) {
        addError("content", "Content is required");
      }
    },
    submit: async (isDraft?: boolean) => {
      await props.onSubmit(form.values, { isDraft: Boolean(isDraft) });
    },
  });

  return (
    <Page title={props.pageTitle} size="medium" navigation={props.navigation} testId={props.testId ?? "new-document-page"}>
      <Forms.Form form={form}>
        <div className="px-12 py-10">
          <Forms.FieldGroup>
            <Forms.TitleInput field="title" placeholder="Title..." autoFocus />

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

          <FormActions
            submitLabel={props.submitLabel ?? "Create document"}
            cancelLink={props.cancelLink}
            hideDraftActions={Boolean(props.hideDraftActions)}
          />
        </PageFooter>
      </Forms.Form>
    </Page>
  );
}

function FormActions({
  submitLabel,
  cancelLink,
  hideDraftActions,
}: {
  submitLabel: string;
  cancelLink: string;
  hideDraftActions: boolean;
}) {
  const form = Forms.useFormContext();

  return (
    <div>
      <div className="flex items-center justify-start gap-4 mt-8">
        <Forms.SubmitButton
          name="submit"
          text={submitLabel}
          buttonSize="base"
          primary
          onClick={() => form.actions.submit(false)}
        />
        {!hideDraftActions && (
          <Forms.SubmitButton name="save-as-draft" text="Save as draft" buttonSize="base" onClick={() => form.actions.submit(true)} />
        )}
      </div>

      <div className="mt-4">
        Or,{" "}
        <Link to={cancelLink} testId="discard" className="font-medium">
          Discard this document
        </Link>
      </div>
    </div>
  );
}
