import * as React from "react";
import * as Projects from "@/models/projects";

import { PrimaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";

export function CheckInButton({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canCheckIn) return null;

  const path = Paths.projectCheckInNewPath(project.id!);

  return <PrimaryButton linkTo={path}>Check-In Now</PrimaryButton>;
}
