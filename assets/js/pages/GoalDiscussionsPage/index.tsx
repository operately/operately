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

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { DivLink } from "@/components/Link";
import plurarize from "@/utils/plurarize";

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

          <div className="flex justify-end my-4">
            <FilledButton size="xs" linkTo={Paths.newGoalDiscussionPath(goal.id)}>
              New Discussion
            </FilledButton>
          </div>

          <div className="text-content-accent text-sm uppercase font-medium mb-4">Updates and Conversations</div>
          <ThreadList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
};

function ThreadList() {
  const { goal, threads } = Pages.useLoadedData<LoaderResult>();

  return (
    <div>
      {threads.map((thread) => (
        <ThreadItem key={thread.id} thread={thread} goal={goal} />
      ))}
    </div>
  );
}

function ThreadItem({ goal, thread }) {
  if (isContentEmpty(thread.message)) return null;

  const path = Paths.goalActivityPath(goal.id, thread.parentId);

  return (
    <div className="flex items-start gap-3 border-t border-stroke-base py-6">
      <div className="w-32 text-sm">
        <FormattedTime time={thread.insertedAt} format="long-date" />
      </div>

      <Avatar person={thread.author} size={40} />

      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <div className="text-content-accent font-semibold leading-none text-lg">Timeframe Changed</div>

          <div className="">
            <RichContent jsonContent={thread.message} />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <FilledButton size="xs" linkTo={path} type="secondary">
              Discuss
            </FilledButton>

            {thread.commentsCount > 0 && (
              <DivLink className="flex items-center gap-1 text-sm leading-none text-content-dimmed" to={path}>
                <Icons.IconMessage2 size={18} />{" "}
                <span className="hover:underline">{plurarize(thread.commentsCount, "comment", "comments")}</span>
              </DivLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
