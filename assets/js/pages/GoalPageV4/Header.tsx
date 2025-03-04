import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";

import { GhostLink } from "@/components/Link/GhostList";
import { Paths } from "@/routes/paths";

import FormattedTime from "@/components/FormattedTime";
import { usePageMode } from ".";

interface HeaderProps {
  goal: Goals.Goal;
}

export function Header({ goal }: HeaderProps) {
  return (
    <div>
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
    </div>
  );
}

function GoalTitle({ goal }: { goal: Goals.Goal }) {
  const [title, setTitle] = React.useState(goal.name);
  const mode = usePageMode();
  const ref = React.useRef<HTMLTextAreaElement>(null);

  function adjustHeight() {
    if (!ref.current) return;

    ref.current.style.height = "inherit";
    ref.current.style.height = `${ref.current.scrollHeight - 35}px`;
  }

  React.useEffect(() => {
    setTimeout(() => {
      adjustHeight();
    }, 0);
  }, [title, mode]);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.selectionStart = title!.length;
    }
  }, [mode, ref, title]);

  if (mode === "edit") {
    return (
      <textarea
        ref={ref}
        className="font-bold text-3xl text-content-accent break-words ring-0 padding-0 focus:ring-0 focus:outline-none w-full p-0 border-none focus:border-none resize-none"
        value={title!}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
    );
  } else {
    return (
      <span className="font-bold text-3xl text-content-accent cursor-pointer break-words pr-3 hover:bg-surface-highlight">
        {title}

        <span
          className="ml-2 bg-green-200 px-2 py-1 text-xs uppercase font-semibold inline-block rounded-full"
          style={{ verticalAlign: "4px" }}
        >
          On Track
        </span>
      </span>
    );
  }
}

function ParentGoal({ goal }: { goal: Goals.Goal | null | undefined }) {
  let content: React.ReactNode;

  if (goal) {
    content = (
      <div className="flex items-center gap-1">
        <Icons.IconTarget size={14} className="text-red-500" />
        <GhostLink to={Paths.goalPath(goal.id!)} text={goal.name!} testId="project-goal-link" dimmed size="sm" />
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
