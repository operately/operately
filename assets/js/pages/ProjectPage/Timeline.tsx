import React from "react";

import * as Time from "@/utils/time";
import * as Projects from "@/models/projects";

import FormattedTime from "@/components/FormattedTime";
import Duration from "@/components/Duration";

import { DimmedLabel } from "./Label";
import { NextMilestone } from "./NextMilestone";

export default function Timeline({ project }) {
  return (
    <div>
      <div className="flex items-start gap-12 text-sm mb-6">
        <StartDate project={project} />
        <EndDate project={project} />
        <DurationField project={project} />
        <Progress project={project} />
      </div>

      <NextMilestone project={project} />
    </div>
  );
}

function StartDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Start Date</DimmedLabel>
      <div className="font-semibold">
        <FormattedTime time={project.startedAt} format="short-date" />
      </div>
    </div>
  );
}

function EndDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Due Date</DimmedLabel>
      {project.deadline ? (
        <div className="font-semibold">
          <FormattedTime time={project.deadline} format="short-date" />
        </div>
      ) : (
        <div>
          <span className="text-content-dimmed">No due date</span>
        </div>
      )}
    </div>
  );
}

function DurationField({ project }: { project: Projects.Project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Duration</DimmedLabel>
      <div className="font-semibold">
        <Duration start={start} end={end} />
      </div>
    </div>
  );
}

function Progress({ project }: { project: Projects.Project }) {
  if (project.status === "closed") return null;
  if (project.isArchived) return null;

  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Progress</DimmedLabel>
      <div className="flex items-center gap-2 ">
        {Time.isPast(start) ? (
          <span className="font-semibold">
            {Time.weeksBetween(start, new Date())} / {Time.weeksBetween(start, end)} weeks
          </span>
        ) : (
          <>Not yet started</>
        )}
      </div>
    </div>
  );
}
