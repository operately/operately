import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData, useRefresh } from "./loader";
import FormattedTime from "@/components/FormattedTime";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { AckCTA } from "./AckCTA";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";
import { CommentSection, useForGoalCheckIn } from "@/features/CommentSection";
import { Paths, compareIds } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentUserContext";

export function Page() {
  const me = useMe();
  const { goal, update } = useLoadedData();
  const refresh = useRefresh();

  const commentsForm = useForGoalCheckIn(update);

  return (
    <Pages.Page title={["Goal Progress Update", goal.name!]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          {compareIds(me.id, update.author?.id) && <Options />}

          <div className="flex flex-col items-center">
            <Title update={update} />
            <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
              <div className="flex items-center gap-2">
                <Avatar person={update.author!} size="tiny" /> {update.author?.fullName}
              </div>
              <TextSeparator />
              <Acknowledgement update={update} />
            </div>
          </div>

          <Spacer size={4} />
          <RichContent jsonContent={update.message!} className="text-lg" />
          <Spacer size={4} />

          <Targets />

          <Spacer size={4} />
          <Reactions />

          <AckCTA />
          <div className="border-t border-stroke-base mt-8" />
          <CommentSection form={commentsForm} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Reactions() {
  const { update } = useLoadedData();
  const reactions = update.reactions!.map((r: any) => r!);
  const entity = { id: update.id!, type: "update" };
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} />;
}

function Acknowledgement({ update }) {
  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Title({ update }) {
  return (
    <div className="text-content-accent text-2xl font-extrabold">
      Progress Update from <FormattedTime time={update.insertedAt} format="long-date" />
    </div>
  );
}

function Navigation({ goal }) {
  const goalPath = Paths.goalPath(goal.id!);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  const { goal, update } = useLoadedData();

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit Update"
        to={Paths.goalEditProgressUpdatePath(goal.id!, update.id!)}
        dataTestId="edit-update"
      />
    </PageOptions.Root>
  );
}

function Targets() {
  const { update } = useLoadedData();
  const targets = update
    .goalTargetUpdates!.map((t) => t!)
    .slice()
    .sort((a, b) => a.index! - b.index!);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-content-accent text-xs font-medium uppercase">Success Conditions</div>
      <div className="flex flex-col gap-2">
        {targets.map((target) => (
          <div key={target.id} className="flex justify-between items-center gap-2">
            <div className="font-medium truncate">{target.name}</div>
            <div className="h-px bg-stroke-base flex-1" />
            <TargetChange target={target} />
            <TargetProgress value={target.value} start={target.from} end={target.to} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TargetProgress({ value, start, end }) {
  const total = end - start;
  const progress = (value - start) / total;
  const width = 100 * progress;

  return (
    <div className="text-xs font-medium bg-gray-500 rounded px-1.5 py-0.5 text-white-1 relative w-[60px] text-right truncate">
      <div className="absolute top-0 left-0 bottom-0 bg-accent-1 rounded" style={{ width: `${width}%` }} />

      <div className="relative">
        {value} / {end}
      </div>
    </div>
  );
}

function TargetChange({ target }) {
  const newProgress = target.value - target.from;
  const oldProgress = target.previousValue - target.from;
  const diff = newProgress - oldProgress;

  if (newProgress > oldProgress) {
    return <div className="text-green-600 font-bold shrink-0 text-sm">+ {Math.abs(diff)}</div>;
  } else if (newProgress < oldProgress) {
    return <div className="text-red-500 font-bold shrink-0 test-sm">- {Math.abs(diff)}</div>;
  } else {
    return <div className="flex items-center gap-1 text-content-dimmed font-medium shrink-0 text-xs">No Change</div>;
  }
}
