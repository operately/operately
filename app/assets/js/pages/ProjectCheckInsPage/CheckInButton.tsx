import * as Projects from "@/models/projects";
import * as React from "react";

import { PrimaryButton } from "turboui";

export function CheckInButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canCheckIn) return null;

  const path = paths.projectCheckInNewPath(project.id!);

  return <PrimaryButton linkTo={path}>Check-In Now</PrimaryButton>;
}
