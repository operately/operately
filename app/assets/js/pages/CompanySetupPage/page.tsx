import * as Pages from "@/components/Pages";
import { usePaths } from "@/routes/paths";
import React from "react";
import { useNavigate } from "react-router-dom";
import { CompanySetupPage } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { company, spaces, workMap } = useLoadedData();

  // Determine completion status for each setup item
  const hasTeamMembers = (company.memberCount ?? 0) > 1;
  const hasSpaces = spaces.length > 1; // More than just the company space
  const hasProjects = workMap.some((item) => item.type === "project");

  // Navigation handlers
  const handleInviteTeam = () => navigate(paths.peoplePath());
  const handleCreateSpace = () => navigate(paths.newSpacePath());
  const handleBrowseWork = () => navigate(paths.workMapPath());

  return (
    <Pages.Page title={["Company Setup", company.name!]} testId="company-setup-page">
      <CompanySetupPage
        inviteTeamCompleted={hasTeamMembers}
        spacesCompleted={hasSpaces}
        projectsCompleted={hasProjects}
        onInviteTeam={handleInviteTeam}
        onCreateSpace={handleCreateSpace}
        onBrowseWork={handleBrowseWork}
      />
    </Pages.Page>
  );
}
