import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Discussion } from "@/models/discussions";
import { DivLink, Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { PrimaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import { CommentsCountIndicator } from "@/features/Comments";

export function Page() {
  const { space, discussions } = useLoadedData();

  return (
    <Pages.Page title={["Discussions", space.name!]} testId="discussions-page">
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
  return (
    <Paper.Header title="Discussions" layout="title-center-actions-left" actions={<NewDiscussionButton />} underline />
  );
}

function NewDiscussionButton() {
  const { space } = useLoadedData();

  return (
    <PrimaryButton linkTo={Paths.discussionNewPath(space.id!)} size="sm" testId="new-discussion">
      New Discussion
    </PrimaryButton>
  );
}

function ContinueEditingDrafts() {
  const { space, myDrafts } = useLoadedData();

  if (myDrafts.length < 1) {
    return null;
  } else if (myDrafts.length === 1) {
    const path = Paths.discussionEditPath(myDrafts[0]!.id!);

    return (
      <div className="flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          Continue writing your draft&hellip;
        </Link>
      </div>
    );
  } else {
    const path = Paths.discussionDraftsPath(space.id!);

    return (
      <div className="flex justify-center">
        <Link className="font-medium" to={path} testId="continue-editing-draft">
          Continue writing your {myDrafts.length} drafts&hellip;
        </Link>
      </div>
    );
  }
}

function ZeroDiscussions() {
  return (
    <div className="text-center text-base text-content-dimmed mt-28">
      Post announcements, pitch ideas, and start discussions.
    </div>
  );
}

function DiscussionList() {
  const { discussions } = useLoadedData();

  return (
    <div className="p-6 flex flex-col">
      {discussions.map((discussion) => (
        <DiscussionListItem key={discussion.id} discussion={discussion} />
      ))}
    </div>
  );
}

function DiscussionListItem({ discussion }: { discussion: Discussion }) {
  assertPresent(discussion.author, "author must be present in discussion");
  assertPresent(discussion.commentsCount, "commentsCount must be present in discussion");

  const path = Paths.discussionPath(discussion.id!);

  const className = classNames(
    "flex gap-4",
    "py-3",
    "last:border-b not-first:border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
    "px-1",
  );

  return (
    <DivLink to={path} className={className}>
      <div className="shrink-0">
        <Avatar person={discussion.author} size="large" />
      </div>

      <div className="flex-1 h-full">
        <div className="font-semibold leading-none mb-1">{discussion.title}</div>
        <div className="break-words">
          <Summary jsonContent={discussion.body!} characterCount={150} />
        </div>

        <div className="flex gap-1 mt-1 text-xs">
          <div className="text-sm text-content-dimmed">{discussion.author.fullName}</div>
          <div className="text-sm text-content-dimmed">·</div>
          <div className="text-sm text-content-dimmed">
            <FormattedTime time={discussion.publishedAt!} format="relative-weekday-or-date" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <CommentsCountIndicator count={discussion.commentsCount} size={28} />
      </div>
    </DivLink>
  );
}
