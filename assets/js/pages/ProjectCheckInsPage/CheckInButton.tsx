import React from "react";

import * as Projects from "@/graphql/Projects";

import { GhostButton } from "@/components/Button";

export function CheckInButton({ project }: { project: Projects.Project }) {
  if (!project.permissions.canCheckIn) return null;

  const path = `/projects/${project.id}/status_updates/new`;

  return <GhostButton linkTo={path}>Check-In Now</GhostButton>;
}
