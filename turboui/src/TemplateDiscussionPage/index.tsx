import React from "react";

import { Avatar } from "../Avatar";
import { CommentSection } from "../CommentSection";
import type { CommentSectionProps } from "../CommentSection";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import RichContent from "../RichContent";
import FormattedTime, { type FormattedTimePreferences } from "../FormattedTime";
import type { PersonField } from "../PersonField";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { IconEdit } from "../icons";

export namespace TemplateDiscussionPage {
  export interface Props {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    discussion: {
      title: string;
      body: unknown;
      author: PersonField.Person | null;
      insertedAt: Date;
    };
    editLink?: string;
    comments?: CommentSectionProps;
    richTextHandlers: RichEditorHandlers;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

export function TemplateDiscussionPage(props: TemplateDiscussionPage.Props) {
  const options = React.useMemo<Page.Option[]>(
    () =>
      props.editLink
        ? [
            {
              type: "link",
              icon: IconEdit,
              label: "Edit discussion",
              link: props.editLink,
              testId: "edit-template-discussion",
            },
          ]
        : [],
    [props.editLink],
  );

  return (
    <Page title={props.pageTitle} navigation={props.navigation} options={options} testId="template-discussion-page">
      <main className="px-8 py-6 sm:px-10 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {props.discussion.author && <Avatar person={props.discussion.author} size={50} />}
            <div>
              <h1 className="text-content-accent text-2xl font-bold leading-tight">{props.discussion.title}</h1>
              <div className="inline-flex items-center gap-1 text-content-dimmed">
                {props.discussion.author?.fullName && <span>{props.discussion.author.fullName}</span>}
                {props.discussion.author && <span>on</span>}
                <FormattedTime
                  {...props.formattedTimePreferences}
                  time={props.discussion.insertedAt}
                  format="long-date"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="my-8">
          <RichContent
            content={props.discussion.body}
            mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
          />
        </div>

        {props.comments && (
          <>
            <div className="border-t border-stroke-base mt-8" />
            <div className="mt-8">
              <CommentSection {...props.comments} />
            </div>
          </>
        )}
      </main>
    </Page>
  );
}
