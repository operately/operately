import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { GhostLink } from "@/components/Link/GhostList";
import { Paths } from "@/routes/paths";

import FormattedTime from "@/components/FormattedTime";
import { SecondaryButton } from "@/components/Buttons";

interface HeaderProps {
  goal: Goals.Goal;
}

export function Header({ goal }: HeaderProps) {
  return (
    <div>
      <Options goal={goal} />
      <Banner goal={goal} />
      <ParentGoal goal={goal.parentGoal} />
      <GoalTitleRow goal={goal} />
    </div>
  );
}

function GoalTitleRow({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="mt-1">
      <GoalTitle goal={goal} />

      <span
        className="bg-green-200 rounded-full px-1.5 py-0.5 text-[10px] uppercase font-semibold mt-1 inline-block"
        style={{ verticalAlign: "4px" }}
      >
        On Track
      </span>
    </div>
  );
}

function GoalTitle({ goal }: { goal: Goals.Goal }) {
  const [title, setTitle] = React.useState(goal.name!);
  const [tempTitle, setTempTitle] = React.useState(goal.name!);
  const [isEditing, setIsEditing] = React.useState(false);

  const ref = React.useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    setTitle(tempTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const startEditing = () => {
    setTempTitle(title);
    setIsEditing(true);

    setTimeout(() => {
      adjustHeight();
      if (!ref.current) return;
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
    }, 10);
  };

  const handleSaveAndCancel = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  function adjustHeight() {
    if (!ref.current) return;

    ref.current.style.height = "inherit";
    ref.current.style.height = `${ref.current.scrollHeight + 40}px`;
  }

  React.useLayoutEffect(adjustHeight, []);

  if (isEditing) {
    return (
      <div className="w-full border-stroke-base rounded">
        <textarea
          ref={ref}
          className="font-bold text-3xl text-content-accent break-words ring-0 padding-0 focus:ring-0 focus:outline-none w-full p-0 border-none focus:border-none"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={handleSaveAndCancel}
          onKeyUp={adjustHeight}
          onBlur={handleSave}
          autoFocus
        />
      </div>
    );
  } else {
    return (
      <span
        className="font-bold text-3xl text-content-accent cursor-pointer break-words pr-3 hover:bg-surface-highlight"
        onClick={startEditing}
      >
        {title}
      </span>
    );
  }
}

function ParentGoal({ goal }: { goal: Goals.Goal | null | undefined }) {
  let content: React.ReactNode;

  const editParent = Paths.goalEditParentPath(goal?.id!);

  if (goal) {
    content = (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Icons.IconTarget size={14} className="text-red-500" />
          <GhostLink to={Paths.goalPath(goal.id!)} text={goal.name!} testId="project-goal-link" dimmed size="sm" />
        </div>

        <SecondaryButton size="xxs" linkTo={editParent}>
          Edit
        </SecondaryButton>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconBuildingEstate size={14} />
        <GhostLink to={Paths.goalsPath()} text="Company-wide goal" testId="company-goals-link" dimmed size="sm" />
      </div>
    );
  }

  return <div className="flex items-center">{content}</div>;
}

function Banner({ goal }) {
  if (goal.isClosed) {
    return (
      <Paper.Banner>
        This goal was closed on <FormattedTime time={goal.closedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  if (goal.isArchived) {
    return (
      <Paper.Banner>
        This goal was archived on <FormattedTime time={goal.archivedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  return null;
}

function Options({ goal }) {
  return (
    <PageOptions.Root testId="goal-options">
      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit Goal Definition"
          to={Paths.goalEditPath(goal.id)}
          testId="edit-goal-definition"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCalendar}
          title="Edit Timeframe"
          to={Paths.goalEditTimeframePath(goal.id)}
          testId="edit-goal-timeframe"
        />
      )}

      {goal.permissions.canEdit && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconExchange}
          title="Change Parent"
          to={Paths.goalEditParentPath(goal.id)}
          testId="change-parent-goal"
        />
      )}

      {goal.permissions.canClose && !goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconCircleCheck}
          title="Close Goal"
          to={Paths.goalClosePath(goal.id)}
          testId="close-goal"
        />
      )}

      {goal.permissions.canClose && goal.isClosed && (
        <PageOptions.Link
          icon={Icons.IconRotateDot}
          title="Reopen Goal"
          to={Paths.goalReopenPath(goal.id)}
          testId="reopen-goal"
        />
      )}
    </PageOptions.Root>
  );
}
