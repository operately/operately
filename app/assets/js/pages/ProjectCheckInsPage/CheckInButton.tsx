import * as Projects from "@/models/projects";
import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { PrimaryButton } from "turboui";

export function CheckInButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canCheckIn) return null;

  const path = DeprecatedPaths.projectCheckInNewPath(project.id!);

  return <PrimaryButton linkTo={path}>Check-In Now</PrimaryButton>;
}
