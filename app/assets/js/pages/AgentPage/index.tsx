import Api, { Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";

import { Avatar, DimmedLink, IconChevronRight, PageNew, showErrorToast } from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "../../routes/paths";

export default { name: "CompanyManageAiAgentsPage", loader, Page } as PageModule;

interface LoaderResult {
  agent: Person;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    agent: await Api.ai.getAgent({ id: params.id }).then((d) => d.agent),
  };
}

function usePageState() {
  const { agent } = Pages.useLoadedData<LoaderResult>();
  const [definition, setDefinition] = React.useState<string>("");

  const paths = usePaths();
  const companyAdminPath = paths.companyAdminPath();
  const companyAiAgentsPath = paths.companyAiAgentsPath();

  const saveDefiniton = async (newDefinition: string) => {
    const oldDefinition = definition;

    try {
      setDefinition(newDefinition);
      await Api.ai.updateAgentDefinition({ id: agent.id, definition: newDefinition });
    } catch (error) {
      setDefinition(oldDefinition);
      showErrorToast("Network error", "Reverting to previous definition");
    }
  };

  return {
    agent,
    companyAdminPath,
    companyAiAgentsPath,
    definition,
    saveDefiniton,
  };
}

function Page() {
  const state = usePageState();

  return (
    <PageNew title={state.agent.fullName}>
      <div className="p-4">
        <div className="text-sm flex items-center gap-1">
          <DimmedLink to={state.companyAdminPath}>Company Admin</DimmedLink>
          <IconChevronRight size={12} />
          <DimmedLink to={state.companyAiAgentsPath}>AI Agents</DimmedLink>
        </div>

        <div className="max-w-xl mx-auto mt-4">
          <AgentHeader state={state} />
          <AgentDefinitionEditor state={state} />
        </div>
      </div>
    </PageNew>
  );
}

function AgentHeader({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar person={state.agent} size={40} />
      <div className="">
        <div className="text-lg font-bold">{state.agent.fullName}</div>
        <div className="flex items-center gap-2 text-sm">{state.agent.title}</div>
      </div>
    </div>
  );
}

function AgentDefinitionEditor({ state }: { state: ReturnType<typeof usePageState> }) {
  const [buffer, setBuffer] = React.useState(state.definition);

  React.useEffect(() => {
    setBuffer(state.definition);
  }, [state.definition]);

  return (
    <div className="mt-6">
      <label className="font-bold text-sm mb-1">Agent Definition</label>
      <textarea
        className="w-full p-2 border border-surface-outline rounded-md"
        rows={10}
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        placeholder="Enter agent definition here..."
        onBlur={(e) => state.saveDefiniton(e.target.value)}
      />
    </div>
  );
}
