import * as React from "react";
import * as Projects from "@/models/projects";

import { FilledButton } from "@/components/Button";
import { Paths } from "@/routes/paths";

export function CheckInButton({ project }: { project: Projects.Project }) {
  if (!project.permissions.canCheckIn) return null;

  const path = Paths.projectCheckInNewPath(project.id);

  return <FilledButton linkTo={path}>Check-In Now</FilledButton>;
}
