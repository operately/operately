import Api, { Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";

import { DimmedLink, IconChevronRight, PageNew } from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "../../routes/paths";

export default { name: "CompanyManageAiAgentsPage", loader, Page } as PageModule;

interface LoaderResult {
  agent: Person[];
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    agent: await Api.ai.getAgent({ id: params.id }).then((d) => d.agent),
  };
}

function usePageState() {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const paths = usePaths();
  const companyAdminPath = paths.companyAdminPath();
  const companyAiAgentsPath = paths.companyAiAgentsPath();

  return {
    agent,
    companyAdminPath,
    companyAiAgentsPath,
  };
}

function Page() {
  const state = usePageState();

  return (
    <PageNew title={state.agent.fullName}>
      <div className="p-4">
        <div className="text-sm">
          <DimmedLink to={state.companyAdminPath}>Company Admin</DimmedLink>
          <IconChevronRight size={16} />
          <DimmedLink to={state.companyAiAgentsPath}>AI Agents</DimmedLink>
        </div>

        <div className="max-w-xl mx-auto mt-4">
          <div className="flex items-center gap-2 justify-between">
            <div className="text-3xl font-bold">{state.agent.fullName}</div>
            <div className="flex items-center gap-2">{state.agent.title}</div>
          </div>
        </div>
      </div>
    </PageNew>
  );
}
