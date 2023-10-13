import * as React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Time from "@/utils/time";

import { TextTooltip } from "@/components/Tooltip";

import * as Milestones from "@/graphql/Projects/milestones";
import FormattedTime from "@/components/FormattedTime";

interface ProjectLifecycleGraphProps {
  projectStart: Date | null;
  projectEnd: Date | null;
  planningDue: Date | null;
  executionDue: Date | null;
  controlDue: Date | null;
  milestones: Milestones.Milestone[];
}

export function ProjectLifecycleGraph(props: ProjectLifecycleGraphProps) {
  const milestones = Milestones.sortByDeadline(props.milestones);

  const firstMilestone = Time.parse(milestones[0]?.deadlineAt || null);
  const lastMilestone = Time.parse(milestones[milestones.length - 1]?.deadlineAt || null);

  const startDate = Time.earliest(props.projectStart, firstMilestone) || Time.today();
  const dueDate = Time.latest(props.projectEnd, lastMilestone) || Time.today();

  let resolution: "weeks" | "months" = "weeks";
  let lineStart: Date | null = startDate;
  let lineEnd: Date | null = dueDate;

  if (Time.daysBetween(startDate, dueDate) > 6 * 7) {
    resolution = "months";
    lineStart = Time.firstOfMonth(startDate);
    lineEnd = Time.lastOfMonth(dueDate);
  } else {
    resolution = "weeks";
    lineStart = Time.closestMonday(startDate, "before");
    lineEnd = Time.closestMonday(dueDate, "after");
  }

  return (
    <div className="overflow-hidden">
      <div className="flex items-center w-full relative" style={{ height: "200px" }}>
        <DateLabels resolution={resolution} lineStart={lineStart} lineEnd={lineEnd} />
        <TodayMarker lineStart={lineStart} lineEnd={lineEnd} />

        <div className="absolute" style={{ top: "90px", height: "40px", left: 0, right: 0 }}>
          <PhaseMarkers lineStart={lineStart} lineEnd={lineEnd} {...props} />

          {milestones.map((milestone: Milestones.Milestone) => (
            <MilestoneMarker key={milestone.id} milestone={milestone} lineStart={lineStart} lineEnd={lineEnd} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseMarkers({ lineStart, lineEnd, projectStart, planningDue, executionDue, controlDue }) {
  return (
    <>
      <PhaseMarker
        phase="planning"
        startedAt={projectStart}
        finishedAt={planningDue}
        lineStart={lineStart}
        lineEnd={lineEnd}
      />

      <PhaseMarker
        phase="execution"
        startedAt={planningDue}
        finishedAt={executionDue}
        lineStart={lineStart}
        lineEnd={lineEnd}
      />

      <PhaseMarker
        phase="control"
        startedAt={executionDue}
        finishedAt={controlDue}
        lineStart={lineStart}
        lineEnd={lineEnd}
      />
    </>
  );
}

function PhaseMarker({ phase, startedAt, finishedAt, lineStart, lineEnd }) {
  const start = Time.parse(startedAt);
  const end = Time.parse(finishedAt);

  if (!start) return null;
  if (!end) return null;

  if (phase === "paused") return null;
  if (phase === "completed") return null;
  if (phase === "canceled") return null;

  const left = `${(Time.secondsBetween(lineStart, start) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.secondsBetween(start, end) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  let colorClass = "bg-green-400";
  switch (phase) {
    case "planning":
      colorClass = "bg-gray-400";
      break;
    case "execution":
      colorClass = "bg-yellow-400";
      break;
    case "control":
      colorClass = "bg-green-400";
      break;
    default:
      throw new Error("Invalid phase " + phase);
  }

  let completedWidth = "0%";

  if (start < Time.today()) {
    if (end < Time.today()) {
      completedWidth = "100%";
    } else {
      completedWidth = `${(Time.secondsBetween(start, Time.today()) / Time.secondsBetween(start, end)) * 100}%`;
    }
  }

  return (
    <div className="absolute" style={{ left: left, width: width, top: 0, bottom: 0 }}>
      <div className={`absolute inset-0 ${colorClass} opacity-30`}></div>
      <div className={`absolute ${colorClass}`} style={{ left: 0, top: 0, bottom: 0, width: completedWidth }}></div>

      <div className="relative text-sm text-dark-1 flex flex-col rounded">
        <span className="mt-1 ml-1.5 uppercase text-xs font-bold truncate inline-block">{phase}</span>
        <span className="ml-1.5 text-dark-2 text-xs font-medium truncate inline-block">
          <FormattedTime time={startedAt} format="short-date" /> -{" "}
          <FormattedTime time={finishedAt} format="short-date" />
        </span>
      </div>
    </div>
  );
}

function TodayMarker({ lineStart, lineEnd }) {
  const today = Time.today();
  const tomorrow = Time.add(today, 1, "days");

  const left = `${(Time.secondsBetween(lineStart, today) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const width = `${(Time.secondsBetween(today, tomorrow) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;

  return (
    <div
      className="bg-dark-5 absolute top-0 bottom-0 text-xs text-white-2 break-keep flex justify-center items-end pb-2"
      style={{ left: left, width: width }}
    >
      <span className="whitespace-nowrap bg-dark-5 px-1.5 py-1 rounded">
        <FormattedTime time={today} format="short-date-with-weekday-relative" />
      </span>
    </div>
  );
}

function MilestoneMarker({ milestone, lineStart, lineEnd }) {
  const date = Time.parse(milestone.deadlineAt);
  if (!date) return null;
  if (date < lineStart) return null;
  if (date > lineEnd) return null;

  const left = `${(Time.secondsBetween(lineStart, date) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const color = milestoneIconColor(milestone);

  const tooltip = (
    <div>
      <div className="uppercase text-xs text-white-2">MILESTONE</div>
      <div className="font-bold">{milestone.title}</div>
    </div>
  );

  return (
    <TextTooltip text={tooltip}>
      <div
        className="absolute flex flex-col items-center justify-normal gap-1 pt-0.5"
        style={{ left: left, top: "-25px", width: "0px" }}
      >
        <Icons.IconCircleFilled size={16} className={color} />
      </div>
    </TextTooltip>
  );
}

function DateLabels({ resolution, lineStart, lineEnd }) {
  let markedDates: Date[] = [];

  switch (resolution) {
    case "weeks":
      markedDates = Time.everyMondayBetween(lineStart, lineEnd);
      break;
    case "months":
      markedDates = Time.everyFirstOfMonthBetween(lineStart, lineEnd, true);
      break;
    default:
      throw new Error("Invalid resolution " + resolution);
  }

  return (
    <>
      {markedDates.map((date, index) => (
        <DateLabel key={index} date={date} lineStart={lineStart} lineEnd={lineEnd} />
      ))}
    </>
  );
}

function DateLabel({ date, lineStart, lineEnd }) {
  const title = <FormattedTime time={date} format="short-date" />;
  const left = `${(Time.secondsBetween(lineStart, date) / Time.secondsBetween(lineStart, lineEnd)) * 100}%`;
  const showLine = left !== "0%";

  return (
    <div
      className={classnames({
        "absolute flex items-start gap-1 break-keep": true,
        "border-x border-shade-1": showLine,
      })}
      style={{ left: left, top: 0, bottom: 0, width: 0, height: "100%" }}
    >
      <span className="text-sm text-white-2 whitespace-nowrap pl-2 pt-2">{title}</span>
    </div>
  );
}

function milestoneIconColor(milestone: Milestones.Milestone) {
  const deadline = Time.parse(milestone.deadlineAt);

  if (milestone.status === "done") return "text-green-400";
  if (!deadline) return "text-white-1/60";

  const isOverdue = deadline < Time.today();

  return isOverdue ? "text-red-400" : "text-white-1/60";
}
