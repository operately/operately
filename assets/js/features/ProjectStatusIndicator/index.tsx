import * as React from "react";
import * as Projects from "@/models/projects";

import classNames from "classnames";

import { COLORS, TITLES, CIRCLE_BACKGROUND_COLORS } from "@/features/projectCheckIns/constants";

interface StatusIndicatorProps {
  project?: Projects.Project;
  status?: string;
  textSize?: string;
  circleSize?: string;
  gapSize?: string;
}

export function StatusIndicator(props: StatusIndicatorProps) {
  if (!props.project && !props.status) throw new Error("StatusIndicator: either project or status must be provided");
  if (props.project && props.status) throw new Error("StatusIndicator: only one of project or status can be provided");
  if (props.project && props.project.status === "closed") throw new Error("StatusIndicator: project is closed");

  const status = props.project ? calculateStatusFromProject(props.project) : props.status!;
  const textSize = props.textSize || "text-sm";
  const circleSize = props.circleSize || "w-4 h-4";
  const gapSize = props.gapSize || "gap-1.5";

  const color = COLORS[status];
  const title = TITLES[status];
  const bgColor = CIRCLE_BACKGROUND_COLORS[color];

  const wrapperClasses = classNames("flex items-center", gapSize);
  const circleClasses = classNames("rounded-full", bgColor, circleSize);
  const titleClasses = classNames(textSize, "leading-none");

  return (
    <div className={wrapperClasses}>
      <div className={circleClasses} />
      <div className={titleClasses}>{title}</div>
    </div>
  );
}

function calculateStatusFromProject(project: Projects.Project): string {
  if (project.status === "paused") {
    return "paused";
  } else if (project.isOutdated) {
    return "outdated";
  } else {
    return project.lastCheckIn?.status || "on_track";
  }
}
