import React from "react";

import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";
import Duration from "@/components/Duration";

import { useNavigateTo } from "@/routes/useNavigateTo";

export default function Timeline({ project, refetch, editable }) {
  return <TimelineGraph project={project} />;
}

const Divider = () => <div className="w-px h-10 bg-shade-2 mx-6" />;
const Label = ({ children }) => <div className="text-xs uppercase text-content-dimmed font-bold mb-1">{children}</div>;

function TimelineGraph({ project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  return (
    <div>
      <div className="flex items-center mb-8">
        <div>
          <Label>Status</Label>
          <HealthIndicator health={project.health} />
        </div>

        <Divider />

        <div>
          <Label>Start Date</Label>
          <FormattedTime time={start} format="short-date" />
        </div>

        <Divider />

        <div>
          <Label>Due Date</Label>
          <FormattedTime time={end} format="short-date" />
        </div>

        <Divider />

        <div>
          <Label>Duration</Label>
          <Duration start={start} end={end} />
        </div>

        <Divider />

        <div>
          <Label>Progress</Label>
          <div className="flex items-center gap-2">
            {Time.weeksBetween(start, new Date())} / {Time.weeksBetween(start, end)} weeks
          </div>
        </div>
      </div>

      <NextMilestone project={project} />
    </div>
  );
}

function ProgressGraph({ start, end }) {
  const now = new Date();

  const totalDays = Time.daysBetween(start, end);
  const usedDays = Time.daysBetween(start, now);
  const width = (usedDays / totalDays) * 100;

  return (
    <div className="flex-1 h-4 bg-shade-2 rounded relative">
      <div className="absolute top-0 bottom-0 left-0 bg-green-400" style={{ width: `${width}%` }} />
    </div>
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
        <span className="font-medium underline decoration-white-2 cursor-pointer">{project.nextMilestone.title}</span>
        <span>&middot;</span>
        <span className="text-white-2">
          due on <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />
        </span>
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
    <div className="font-medium flex items-center gap-1">
      <Icons.IconCircleFilled size={12} className={color} />
      <span className="font-medium capitalize">{title}</span>
    </div>
  );
}
