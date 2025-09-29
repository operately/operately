import * as Pages from "@/components/Pages";
import { usePaths } from "@/routes/paths";
import React from "react";
import { CompanySetupPage } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const { company, spaces, workMap } = useLoadedData();

  // Determine completion status for each setup item
  const hasTeamMembers = (company.memberCount ?? 0) > 1;
  const hasSpaces = spaces.length > 1; // More than just the company space
  const hasProjects = workMap.some((item) => item.type === "project");

  const setupItems: CompanySetupPage.SetupItem[] = [
    {
      id: "invite-team",
      title: "Invite your team",
      description: "Get your colleagues onboard and start collaborating together.",
      linkTo: paths.peoplePath(),
      linkText: "Invite team members",
      isCompleted: hasTeamMembers,
      testId: "setup-invite-team",
    },
    {
      id: "create-spaces",
      title: "Set up Spaces",
      description: "Create organized spaces for different teams, departments, or initiatives.",
      linkTo: paths.newSpacePath(),
      linkText: "Create a space",
      isCompleted: hasSpaces,
      testId: "setup-create-space",
    },
    {
      id: "add-projects",
      title: "Add your first project",
      description: "Start tracking progress on your most important work.",
      linkTo: paths.workMapPath(),
      linkText: "Browse work",
      isCompleted: hasProjects,
      testId: "setup-add-project",
    },
  ];

  return (
    <Pages.Page title={["Company Setup", company.name!]} testId="company-setup-page">
      <CompanySetupPage
        title={`Let's set up ${company.name}!`}
        subtitle="Complete these steps to get your team organized and productive."
        setupItems={setupItems}
      />
    </Pages.Page>
  );
}
