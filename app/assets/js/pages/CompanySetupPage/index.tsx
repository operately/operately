import React from "react";

import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import { CompanySetupPage } from "turboui";

import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Spaces from "@/models/spaces";
import * as WorkMap from "@/models/workMap";
import { useMe } from "../../contexts/CurrentCompanyContext";
import { firstName } from "../../models/people";

export default {
  name: "CompanySetupPage",
  loader,
  Page,
} as PageModule;

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
  workMap: WorkMap.WorkMapItem[];
}

async function loader({ params }): Promise<LoaderData> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    spaces: await Spaces.getSpaces({
      includeAccessLevels: true,
    }),
    workMap: await WorkMap.getWorkMap({}).then((d) => d.workMap || []),
  };
}

function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const me = useMe();

  const { company, spaces, workMap } = useLoadedData();

  // Determine completion status for each setup item
  const hasTeamMembers = (company.memberCount ?? 0) > 1;
  const hasSpaces = spaces.length > 1; // More than just the company space
  const hasProjects = workMap.some((item) => item.type === "project");

  // Navigation handlers
  const handleInviteTeam = () => navigate(paths.peoplePath());
  const handleCreateSpace = () => navigate(paths.newSpacePath());
  const handleAddProject = () => navigate(paths.newProjectPath());

  return (
    <Pages.Page title={["Setup", company.name!]} testId="company-setup-page">
      <CompanySetupPage
        inviteTeamCompleted={hasTeamMembers}
        spacesCompleted={hasSpaces}
        projectsCompleted={hasProjects}
        onInviteTeam={handleInviteTeam}
        onCreateSpaces={handleCreateSpace}
        onAddProject={handleAddProject}
        name={firstName(me!)}
        bookDemoUrl={window.appConfig!.bookDemoUrl}
        discordUrl={window.appConfig!.discordUrl}
      />
    </Pages.Page>
  );
}
