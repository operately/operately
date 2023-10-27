import React from "react";

import classnames from "classnames";

import * as Time from "@/utils/time";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

import { useNavigateTo } from "@/routes/useNavigateTo";

export default function Timeline({ project, refetch, editable }) {
  return <TimelineGraph project={project} />;
}

function TimelineGraph({ project }) {
  const [mouse, mouseEvents] = useMousePosition();

  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);
  const today = Time.today();

  if (!start || !end) return null;

  const percentage = (Time.daysBetween(start, today) / Time.daysBetween(start, end)) * 100;

  let days = [] as Date[];
  for (let i = 1; i < Time.daysBetween(start, end) / 7; i++) {
    days.push(Time.add(start, i, "weeks"));
  }

  return (
    <div>
      <div className="flex items-center gap-10 mb-4">
        <HealthIndicator health={project.health} />

        <div>
          <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Timeline</div>

          <div className="">
            <FormattedTime time={start} format="short-date" />
            <span className="mx-1">-&gt;</span>
            <FormattedTime time={end} format="short-date" />
          </div>
        </div>

        <NextMilestone project={project} />
      </div>

      <div className="bg-shade-1 rounded-xl shadow-xl p-4 relative flex-1" {...mouseEvents}>
        <div
          className="absolute left-4 right-4 h-0.5 bg-green-400 rounded-xl top-1/2 transform -translate-y-1/2"
          style={{ width: `${percentage}%` }}
        />

        <div className="absolute left-4 right-4 h-0.5 bg-shade-3 rounded-xl top-1/2 transform -translate-y-1/2" />

        {project.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={classnames({
              "rounded-full h-3 w-3 absolute top-1/2 transform -translate-y-1/2": true,
              "bg-green-400": Milestones.isDone(milestone),
              "bg-shade-3": !Milestones.isDone(milestone) && !Milestones.isOverdue(milestone),
              "bg-red-400 z-10": Milestones.isOverdue(milestone),
            })}
            style={{
              left: `${
                (Time.daysBetween(start, Time.parse(milestone.deadlineAt)) / Time.daysBetween(start, end)) * 100
              }%`,
            }}
          />
        ))}

        {days.map((day) => (
          <div
            key={day}
            className="rounded-full top-1.5 bottom-1.5 bg-shade-2 absolute w-px"
            style={{
              left: `${(Time.daysBetween(start, Time.parse(day)) / Time.daysBetween(start, end)) * 100}%`,
            }}
          />
        ))}

        <HoverLine mouse={mouse} start={start} end={end} milestones={project.milestones} />
      </div>
    </div>
  );
}

function useMousePosition() {
  const [mouse, setMouse] = React.useState({ x: 0, y: 0, outside: true, percentage: 0 });

  const handleMouseEnter = () => {
    setMouse((m) => ({ ...m, outside: false }));
  };

  const handleMouseLeave = () => {
    setMouse((m) => ({ ...m, outside: true }));
  };

  const handleMouseMove = (event) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const width = rect.width;
    const percentage = (x / width) * 100;

    setMouse((m) => ({ x, y: y, percentage: percentage, outside: m.outside }));
  };

  return [mouse, { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onMouseMove: handleMouseMove }];
}

function HoverLine({ mouse, start, end, milestones }) {
  if (mouse.outside) return null;

  const date = Time.add(start, Math.floor((mouse.percentage / 100) * Time.daysBetween(start, end)), "days");

  const hoveredMilestones = milestones.filter((milestone) => {
    const milestoneDate = Time.parse(milestone.deadlineAt);
    if (!milestoneDate) return false;

    const pos = (Time.daysBetween(start, milestoneDate) / Time.daysBetween(start, end)) * 100;

    if (pos < mouse.percentage - 2 || pos > mouse.percentage + 2) return false;

    return true;
  });

  return (
    <div className="cursor-auto">
      <div
        className="absolute left-0 right-0 top-1 bottom-1 w-px bg-green-400"
        style={{ left: `${mouse.percentage}%` }}
      ></div>
      <div className="absolute" style={{ left: `${mouse.percentage}%` }}>
        <div className="z-50 absolute top-4 left-1/2 transform -translate-x-1/2 bg-dark-1 shadow-xl rounded-lg text-sm whitespace-nowrap px-2 py-1">
          <FormattedTime time={date} format="short-date" />
          {hoveredMilestones.length > 0 && (
            <div className="mt-2">
              <div className="font-bold text-white-1">Milestones</div>
              {hoveredMilestones.map((milestone) => (
                <div key={milestone.id}>
                  <div className="flex items-center gap-2">
                    <FormattedTime time={milestone.deadlineAt} format="short-date" />
                    <span className="font-semibold">{milestone.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditTimeline({ project }) {
  return (
    <Button variant="secondary" data-test-id="edit-project-timeline" linkTo={`/projects/${project.id}/edit/timeline`}>
      Edit Timeline
    </Button>
  );
}

function MilestonesSection({ project }) {
  const completedMilestones = project.milestones.filter((milestone) => milestone.completedAt);
  const totalMilestones = project.milestones.length;

  return (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={completedMilestones.length} total={totalMilestones} />

      <span className="font-semibold">
        {completedMilestones.length}/{totalMilestones} milestones completed
      </span>
      <span className="mx-0.5">&middot;</span>
      <span className="underline cursor-pointer decoration-blue-400 text-blue-400">View all milestones</span>
    </div>
  );
}

function MiniPieChart({ completed, total }) {
  const percentage = Math.ceil((completed / total) * 100);

  return (
    <div
      style={{
        borderRadius: "50%",
        backgroundImage: `conic-gradient(var(--color-green-400) ${percentage}%, var(--color-green-900) ${percentage}% 100%)`,
        height: "16px",
        width: "16px",
      }}
    />
  );
}

function NextMilestone({ project }) {
  if (!project.nextMilestone) return null;

  const gotoMilestone = useNavigateTo(`/projects/${project.id}/milestones/${project.nextMilestone.id}`);

  return (
    <div>
      <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Next milestone</div>
      <div className="font-medium flex items-center gap-1" onClick={gotoMilestone}>
        <Icons.IconFlagFilled size={16} className="text-yellow-400" />
        <span className="font-medium underline decoration-white-2 cursor-pointer"> {project.nextMilestone.title}</span>
      </div>
    </div>
  );
}

function HealthIndicator({ health }) {
  const colors = {
    on_track: "text-green-400",
    at_risk: "text-yellow-400",
    off_track: "text-red-400",
  };

  const color = colors[health];
  const title = health.replace("_", " ");

  return (
    <div>
      <div className="text-xs uppercase text-white-1/80 font-medium mb-1">Status</div>

      <div className="font-medium flex items-center gap-1">
        <Icons.IconCircleFilled size={12} className={color} />
        <span className="font-medium capitalize">{title}</span>
      </div>
    </div>
  );
}
