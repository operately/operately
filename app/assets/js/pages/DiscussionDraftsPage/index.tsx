import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";
import { PageModule } from "@/routes/types";
import * as Time from "@/utils/time";
import * as React from "react";

import { useBoolState } from "@/hooks/useBoolState";
import { Discussion } from "@/models/discussions";
import { truncateString } from "@/utils/strings";
import { createTestId } from "@/utils/testid";
import {
  DiscardDiscussionDraftModal,
  DivLink,
  PrimaryButton,
  richContentToString,
  Avatar,
  FormattedTime,
  IconDots,
  IconTrash,
  Menu,
  MenuActionItem,
} from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";

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
  const path = paths.discussionEditPath(discussion.id!);
  const formattedTimePreferences = useFormattedTimePreferences();

  const className = classNames(
    "flex items-start gap-4",
    "py-3",
    "last:border-b not-first:border-t border-stroke-base",
    "hover:bg-surface-highlight",
    "px-1",
  );

  const testId = createTestId("discussion-list-item", discussion.title!);
  const contentSnippet = richContentToString(JSON.parse(discussion.body!));

  return (
    <div className={className}>
      <DivLink to={path} className="flex flex-1 items-start gap-4 min-w-0 cursor-pointer" testId={testId}>
        {discussion.author && (
          <div className="shrink-0">
            <Avatar person={discussion.author} size="large" />
          </div>
        )}

        <div className="flex-1 h-full min-w-0">
          <div className="font-semibold leading-none mb-1">{discussion.title}</div>
          <div className="break-words line-clamp-2">
            <span className="font-medium text-content-dimmed">
              Last edited on <FormattedTime {...formattedTimePreferences} time={discussion.updatedAt!} format="relative-time-or-date" /> &mdash;{" "}
            </span>
            {truncateString(contentSnippet, 60)}
          </div>
        </div>
      </DivLink>

      <DiscussionDraftOptions discussion={discussion} />
    </div>
  );
}

function DiscussionDraftOptions({ discussion }: { discussion: Discussion }) {
  const paths = usePaths();
  const navigate = useNavigate();
  const { space } = Pages.useLoadedData<LoadedData>();
  const [archive] = Discussions.useArchiveMessage();
  const [showDiscardModal, toggleDiscardModal] = useBoolState(false);

  return (
    <>
      <div className="shrink-0">
        <Menu
          size="tiny"
          align="end"
          testId={createTestId("discussion-draft-options", discussion.title!)}
          customTrigger={
            <button
              type="button"
              title="Draft actions"
              aria-label="Draft actions"
              className="w-6 h-6 flex items-center justify-center rounded-full text-content-dimmed hover:text-content-base hover:bg-surface-dimmed focus:text-content-base focus:bg-surface-dimmed focus:outline-none"
            >
              <IconDots size={16} />
            </button>
          }
        >
          <MenuActionItem
            onClick={toggleDiscardModal}
            testId={createTestId("discard-draft", discussion.title!)}
            icon={IconTrash}
            danger
          >
            Discard draft
          </MenuActionItem>
        </Menu>
      </div>

      <DiscardDiscussionDraftModal
        isOpen={showDiscardModal}
        onClose={toggleDiscardModal}
        onDiscard={() => archive({ id: discussion.id })}
        onSuccess={() => navigate(paths.discussionDraftsPath(space.id), { replace: true })}
      />
    </>
  );
}
