import React from "react";
import * as Time from "@/utils/time";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { DivLink } from "@/components/Link";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { Summary } from "@/components/RichContent";
import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <SpacePageNavigation space={space} activeTab="discussions" />
          <div className="mt-4 mb-8 flex items-center justify-between">
            <div className="text-2xl font-extrabold">Discussions</div>
            <FilledButton linkTo={Paths.discussionNewPath(space.id!)} size="sm" testId="new-discussion">
              New Discussion
            </FilledButton>
          </div>
          <DiscussionList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function DiscussionList() {
  const { discussions } = useLoadedData();

  const sortedDiscussions = [...discussions].sort((a, b) => {
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

function DiscussionListItem({ discussion }) {
  const path = Paths.discussionPath(discussion.id);

  return (
    <DivLink
      to={path}
      className="flex items-start gap-4 py-3 last:border-b border-t border-stroke-base cursor-pointer hover:bg-surface-highlight px-1"
    >
      <div className="shrink-0">
        <Avatar person={discussion.author} size="large" />
      </div>

      <div className="flex-1 h-full">
        <div className="font-semibold leading-none mb-1">{discussion.title}</div>
        <Summary jsonContent={discussion.body} characterCount={250} />

        <div className="flex gap-1 mt-1 text-xs">
          <div className="text-sm text-content-dimmed">{discussion.author.fullName}</div>
          <div className="text-sm text-content-dimmed">·</div>
          <div className="text-sm text-content-dimmed">
            <FormattedTime time={discussion.insertedAt} format="long-date" />
          </div>
        </div>
      </div>
    </DivLink>
  );
}
