import React from "react";

import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";
import Duration from "@/components/Duration";

import { Label } from "./Label";

export default function Timeline({ project, refetch, editable }) {
  return <TimelineGraph project={project} />;
}

const Divider = () => <div className="w-px h-10 bg-shade-2 mx-6" />;
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
