import { useTranslation } from "react-i18next";
import { tn } from "@/i18n";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { Discussion } from "@/models/discussions";
import { usePaths } from "@/routes/paths";
import {
  DivLink,
  Link,
  PrimaryButton,
  Avatar,
  CommentCountIndicator,
  Summary,
  FormattedTime,
  displayDate,
  ScheduledPostDate,
  ScheduledPostLabel,
} from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

import { useLoadedData } from "./loader";
import { createTestId } from "@/utils/testid";

import classNames from "classnames";

export function Page() {
  const { t } = useTranslation();
  const { space, discussions } = useLoadedData();

  return (
    <Pages.Page title={[t("Discussions"), space.name]} testId="discussions-page">
      <Paper.Root size="large">
        <SpacePageNavigation space={space} />

        <Paper.Body minHeight="500px">
          <Header />
          <ContinueEditingDrafts />
          {discussions.length < 1 ? <ZeroDiscussions /> : <DiscussionList />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <Paper.Header
      title={t("Discussions")}
      layout="title-center-actions-left"
      actions={<NewDiscussionButton />}
      underline
    />
  );
}

function NewDiscussionButton() {
  const { t } = useTranslation();
  const { space } = useLoadedData();
  const paths = usePaths();

  if (!space.permissions?.canEdit) return null;

  return (
    <PrimaryButton linkTo={paths.discussionNewPath(space.id)} size="sm" testId="new-discussion">
      {t("New discussion")}
    </PrimaryButton>
  );
}

function ContinueEditingDrafts() {
  const { t } = useTranslation();
  const { space, myDrafts } = useLoadedData();
  const paths = usePaths();

  if (myDrafts.length < 1) {
    return null;
  } else if (myDrafts.length === 1 && myDrafts[0]) {
    const path = paths.discussionEditPath(myDrafts[0].id);

    return (
      <div className="mb-4 flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          {t("Continue writing your draft…")}
        </Link>
      </div>
    );
  } else {
    const path = paths.discussionDraftsPath(space.id);

    return (
      <div className="mb-4 flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          {tn("Continue writing your draft…", "Continue writing your {{count}} drafts…", myDrafts.length)}
        </Link>
      </div>
    );
  }
}

function ZeroDiscussions() {
  const { t } = useTranslation();
  return (
    <div className="px-4 py-16 text-center text-base text-content-dimmed">
      {t("Post announcements, pitch ideas, and start discussions.")}
    </div>
  );
}

function DiscussionList() {
  const { discussions } = useLoadedData();

  return (
    <div className="flex flex-col">
      {discussions.map((discussion) => (
        <DiscussionListItem key={discussion.id} discussion={discussion} />
      ))}
    </div>
  );
}

function DiscussionListItem({ discussion }: { discussion: Discussion }) {
  const paths = usePaths();
  const path = paths.discussionPath(discussion.id);
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const formattedTimePreferences = useFormattedTimePreferences();

  const className = classNames(
    "flex items-center gap-3 sm:gap-4",
    "py-3",
    "last:border-b not-first:border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
    "px-1",
  );

  return (
    <DivLink to={path} className={className} testId={createTestId("discussion-list-item", discussion.title)}>
      {discussion.author && (
        <div className="shrink-0">
          <Avatar person={discussion.author} size="large" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <div className="truncate font-semibold leading-none">{discussion.title}</div>
          {discussion.state === "scheduled" && <ScheduledPostLabel />}
        </div>
        <div className="break-words">
          <Summary content={discussion.body ?? ""} characterCount={150} mentionedPersonLookup={mentionedPersonLookup} />
        </div>

        <div className="mt-1 flex min-w-0 flex-wrap gap-1 text-xs">
          {discussion.author && (
            <>
              <div className="text-sm text-content-dimmed">{discussion.author.fullName}</div>
              <div className="text-sm text-content-dimmed">·</div>
            </>
          )}
          {discussion.state === "scheduled" && discussion.scheduledAt ? (
            <ScheduledPostDate
              scheduledAt={discussion.scheduledAt}
              formattedTimePreferences={formattedTimePreferences}
            />
          ) : (
            <div className="text-sm text-content-dimmed">
              <FormattedTime
                {...formattedTimePreferences}
                time={displayDate(discussion)}
                format="relative-weekday-or-date"
              />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0" data-test-id="discussion-comment-count">
        <CommentCountIndicator count={discussion.commentsCount || 0} size={28} />
      </div>
    </DivLink>
  );
}
