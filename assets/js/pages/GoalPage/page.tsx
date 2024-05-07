import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Feed, useItemsQuery } from "@/features/Feed";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { SuccessConditions } from "@/features/goals/SuccessConditions";

import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { FilledButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { DivLink } from "@/components/Link";
import plurarize from "@/utils/plurarize";

import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="status" />

          <div className="border-b border-surface-outline flex items-center justify-center -mx-12 relative z-20 -mt-4">
            <div className="bg-stone-500 font-medium text-white-1 px-2 py-1 uppercase text-[10px] tracking-wide rounded-t-lg mt-4">
              Success Conditions
            </div>
          </div>

          <SuccessConditions goal={goal} />

          <div className="border-b border-surface-outline flex items-center justify-center -mx-12 relative z-20">
            <div className="bg-stone-500 font-medium text-white-1 px-2 py-1 uppercase text-[10px] tracking-wide rounded-t-lg mt-4">
              Conversations &amp; Updates
            </div>
          </div>

          <div className="flex items-center justify-end mb-4">
            <FilledButton size="xs" linkTo={Paths.newGoalDiscussionPath(goal.id)} type="secondary">
              New Discussion
            </FilledButton>
          </div>

          <ThreadList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalFeed() {
  const { goal } = useLoadedData();

  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">Activity</div>
      <GoalFeedItems goal={goal} />
    </Paper.DimmedSection>
  );
}

function GoalFeedItems({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data.activities} page="goal" />;
}

function ThreadList() {
  const { goal, threads } = useLoadedData();

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
          <div className="text-content-accent font-semibold leading-none">Timeframe Changed</div>

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
