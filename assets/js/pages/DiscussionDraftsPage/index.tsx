import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as Discussions from "@/models/discussions";
import * as Time from "@/utils/time";

import { Discussion } from "@/models/discussions";
import { DivLink } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

import { assertPresent } from "@/utils/assertions";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { PrimaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { createTestId } from "@/utils/testid";

interface LoadedData {
  space: Spaces.Space;
  myDrafts: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
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

export function Page() {
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
  const { space } = Pages.useLoadedData<LoadedData>();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>{space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>Discussions</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header() {
  return (
    <Paper.Header title="Your Drafts" layout="title-center-actions-left" underline actions={<NewDiscussionButton />} />
  );
}

function NewDiscussionButton() {
  const { space } = Pages.useLoadedData<LoadedData>();

  return (
    <PrimaryButton linkTo={Paths.discussionNewPath(space.id!)} size="sm" testId="new-discussion">
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
  assertPresent(discussion.author, "author must be present in discussion");

  const path = Paths.discussionEditPath(discussion.id!);

  const className = classNames(
    "flex items-start gap-4",
    "py-3",
    "last:border-b not-first:border-t border-stroke-base",
    "cursor-pointer",
    "hover:bg-surface-highlight",
    "px-1",
  );

  const testId = createTestId("discussion-list-item", discussion.title!);

  return (
    <DivLink to={path} className={className} testId={testId}>
      <div className="shrink-0">
        <Avatar person={discussion.author} size="large" />
      </div>

      <div className="flex-1 h-full">
        <div className="font-semibold leading-none mb-1">{discussion.title}</div>
        <div className="break-words line-clamp-2">
          <span className="font-medium text-content-dimmed">
            Last edited on <FormattedTime time={discussion.updatedAt!} format="long-date" /> &mdash;{" "}
          </span>
          <Summary jsonContent={discussion.body!} characterCount={250} as="span" />
        </div>
      </div>
    </DivLink>
  );
}
