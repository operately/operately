import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";
import { PageModule } from "@/routes/types";
import * as Time from "@/utils/time";
import * as React from "react";

import { Discussion } from "@/models/discussions";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";
import { createTestId } from "@/utils/testid";
import { DivLink, PrimaryButton, richContentToString } from "turboui";

import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "DiscussionDraftsPage", loader, Page } as PageModule;

interface LoadedData {
  space: Spaces.Space;
  myDrafts: Discussions.Discussion[];
}

async function loader({ params }): Promise<LoadedData> {
  const [space, [myDrafts]] = await Promise.all([
    Spaces.getSpace({ id: params.id, includePermissions: true }),
    Discussions.getDiscussions({ spaceId: params.id, includeAuthor: true, includeMyDrafts: true }).then((data) => [
      data.myDrafts!,
    ]),
  ]);

  return {
    space,
    myDrafts: myDrafts!,
  };
}

function Page() {
  const { space, myDrafts } = Pages.useLoadedData<LoadedData>();

  return (
    <Pages.Page title={["Drafts", "Discussions", space.name!]} testId="discussions-page">
      <Paper.Root size="large">
        <Navigation />

        <Paper.Body minHeight="500px">
          <Header />
          {myDrafts.length < 1 ? <ZeroDiscussions /> : <DiscussionList />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const paths = usePaths();
  const { space } = Pages.useLoadedData<LoadedData>();

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(space.id!), label: space.name! },
        { to: paths.spaceDiscussionsPath(space.id!), label: "Discussions" },
      ]}
    />
  );
}

function Header() {
  return (
    <Paper.Header title="Your Drafts" layout="title-center-actions-left" underline actions={<NewDiscussionButton />} />
  );
}

function NewDiscussionButton() {
  const paths = usePaths();
  const { space } = Pages.useLoadedData<LoadedData>();

  return (
    <PrimaryButton linkTo={paths.discussionNewPath(space.id!)} size="sm" testId="new-discussion">
      New Discussion
    </PrimaryButton>
  );
}

function ZeroDiscussions() {
  return <div className="text-center text-base font-medium mt-28">You don't have any drafts.</div>;
}

function DiscussionList() {
  const { myDrafts } = Pages.useLoadedData<LoadedData>();

  const sortedDiscussions = [...myDrafts].sort((a, b) => {
    const aDate = Time.parseISO(a.insertedAt!);
    const bDate = Time.parseISO(b.insertedAt!);

    if (aDate > bDate) {
      return -1;
    } else if (aDate < bDate) {
      return 1;
    } else {
      return 0;
    }
  });

  return (
    <div className="mt-4 flex flex-col">
      {sortedDiscussions.map((discussion) => (
        <DiscussionListItem key={discussion.id} discussion={discussion} />
      ))}
    </div>
  );
}

function DiscussionListItem({ discussion }: { discussion: Discussion }) {
  const paths = usePaths();
  assertPresent(discussion.author, "author must be present in discussion");

  const path = paths.discussionEditPath(discussion.id!);

  const className = classNames(
    "flex items-start gap-4",
    "py-3",
    "last:border-b not-first:border-t border-stroke-base",
    "cursor-pointer",
    "hover:bg-surface-highlight",
    "px-1",
  );

  const testId = createTestId("discussion-list-item", discussion.title!);
  const contentSnippet = richContentToString(JSON.parse(discussion.body!));

  return (
    <DivLink to={path} className={className} testId={testId}>
      <div className="shrink-0">
        <Avatar person={discussion.author} size="large" />
      </div>

      <div className="flex-1 h-full">
        <div className="font-semibold leading-none mb-1">{discussion.title}</div>
        <div className="break-words line-clamp-2">
          <span className="font-medium text-content-dimmed">
            Last edited on <FormattedTime time={discussion.updatedAt!} format="relative-time-or-date" /> &mdash;{" "}
          </span>
          {truncateString(contentSnippet, 60)}
        </div>
      </div>
    </DivLink>
  );
}
