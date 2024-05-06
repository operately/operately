import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as CommentThreads from "@/models/commentThreads";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { FilledButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import plurarize from "@/utils/plurarize";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { DivLink } from "@/components/Link";

interface LoaderResult {
  goal: Goals.Goal;
  threads: CommentThreads.CommentThread[];
}

export const loader = async function ({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId }),
    threads: await CommentThreads.getCommentThreads({
      scopeType: "goal",
      scopeId: params.goalId,
    }),
  };
};

export const Page = function () {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="discussions" />

          <div className="flex items-start my-4">
            <FilledButton size="xxs" linkTo={Paths.newGoalDiscussionPath(goal.id)}>
              New Discussion
            </FilledButton>
          </div>

          <ThreadList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
};

function ThreadList() {
  const { threads } = Pages.useLoadedData<LoaderResult>();

  return (
    <div>
      {threads.map((thread) => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
}

function ThreadItem({ thread }) {
  if (isContentEmpty(thread.message)) return null;

  const path = Paths.goalActivityPath("1", "2");

  return (
    <DivLink
      className="flex items-start gap-3 border-t border-stroke-base py-4 hover:bg-surface-highlight cursor-pointer"
      to={path}
    >
      <Avatar person={thread.author} size={32} />

      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <div className="text-content-accent font-bold leading-none test-sm">Goal timeframe edited</div>

          <div className="text-sm">
            <RichContent jsonContent={thread.message} />
          </div>

          <div className="flex items-center gap-1 text-xs leading-none text-content-dimmed mt-2">
            <Icons.IconMessage size={12} /> {plurarize(thread.commentsCount, "comment", "comments")}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-xs leading-none text-content-dimmed">
          <FormattedTime time={thread.insertedAt} format="short-date" />
        </div>
      </div>
    </DivLink>
  );
}
