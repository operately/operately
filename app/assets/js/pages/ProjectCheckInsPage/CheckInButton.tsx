import * as Projects from "@/models/projects";
import * as React from "react";

import { PrimaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export function CheckInButton({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  if (!project.permissions!.canCheckIn) return null;

  const path = paths.projectCheckInNewPath(project.id!);

  return <PrimaryButton linkTo={path}>Check in</PrimaryButton>;
}
