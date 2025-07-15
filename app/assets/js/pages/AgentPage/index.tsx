import Api, { AgentRun, Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";

import {
  Avatar,
  DimmedLink,
  FormattedTime,
  IconChevronRight,
  IconX,
  PageNew,
  PrimaryButton,
  showErrorToast,
  showSuccessToast,
  SwitchToggle,
} from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "../../routes/paths";

export default { name: "CompanyManageAiAgentsPage", loader, Page } as PageModule;

interface LoaderResult {
  agent: Person;
  runs: AgentRun[];
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    agent: await Api.ai.getAgent({ id: params.id }).then((d) => d.agent),
    runs: await Api.ai.listAgentRuns({ agentId: params.id }).then((d) => d.runs),
  };
}

interface State {
  agent: Person;
  runs: AgentRun[];
  companyAdminPath: string;
  companyAiAgentsPath: string;
  definition: string;
  saveDefiniton: (newDefinition: string) => Promise<void>;
  runAgent: () => Promise<void>;
  sandboxMode: boolean;
  saveSandboxMode: (newSandboxMode: boolean) => Promise<void>;
  expandedRun: AgentRun | null;
  expandRun: (runId: AgentRun) => void;
  closeRun: () => void;
  creatingRun: boolean;
  refreshRun: () => void;
}

function usePageState(): State {
  const { agent, runs: loadedRuns } = Pages.useLoadedData<LoaderResult>();

  const [definition, setDefinition] = React.useState<string>(agent.agentDef!.definition);
  const [sandboxMode, setSandboxMode] = React.useState<boolean>(agent.agentDef!.sandboxMode);
  const [expandedRun, setExpandedRun] = React.useState<AgentRun | null>(null);
  const [runs, setRuns] = React.useState<AgentRun[]>(loadedRuns);
  const [creatingRun, setCreatingRun] = React.useState<boolean>(false);

  const paths = usePaths();
  const companyAdminPath = paths.companyAdminPath();
  const companyAiAgentsPath = paths.companyAiAgentsPath();

  const saveDefiniton = async (newDefinition: string) => {
    const oldDefinition = definition;

    try {
      setDefinition(newDefinition);
      await Api.ai.editAgentDefinition({ id: agent.id, definition: newDefinition });
      showSuccessToast("Success", "Agent definition updated successfully");
    } catch (error) {
      setDefinition(oldDefinition);
      showErrorToast("Network error", "Reverting to previous definition");
    }
  };

  const saveSandboxMode = async (newSandboxMode: boolean) => {
    const oldSandboxMode = sandboxMode;

    try {
      setSandboxMode(newSandboxMode);
      await Api.ai.editAgentSandboxMode({ id: agent.id, mode: newSandboxMode });
      showSuccessToast("Success", "Agent sandbox mode updated successfully");
    } catch (error) {
      setSandboxMode(oldSandboxMode);
      showErrorToast("Network error", "Reverting to previous sandbox mode");
    }
  };

  const runAgent = async () => {
    if (creatingRun) return;
    setCreatingRun(true);

    try {
      const res = await Api.ai.runAgent({ id: agent.id });
      showSuccessToast("Success", "Agent is running");
      console.log("Agent run response:", res);

      setRuns((prevRuns) => [...prevRuns, res.run]);
      setExpandedRun(res.run);
    } catch (error) {
      showErrorToast("Network error", "Failed to run agent");
    }

    setCreatingRun(false);
  };

  const expandRun = (run: AgentRun) => {
    setExpandedRun(run);
  };

  const closeRun = () => {
    setExpandedRun(null);
  };

  const refreshRun = async () => {
    if (!expandedRun) return;

    const updatedRun = await Api.ai.getAgentRun({ id: expandedRun.id }).then((d) => d.run);
    setExpandedRun(updatedRun);
  };

  return {
    agent,
    runs,
    companyAdminPath,
    companyAiAgentsPath,
    definition,
    saveDefiniton,
    runAgent,
    sandboxMode,
    saveSandboxMode,
    expandedRun,
    expandRun,
    closeRun,
    creatingRun,
    refreshRun,
  };
}

function Page() {
  const state = usePageState();

  return (
    <PageNew title={state.agent.fullName}>
      <div className="text-sm flex items-center gap-1 p-4 py-2 border-b border-stroke-base">
        <DimmedLink to={state.companyAdminPath}>Company Admin</DimmedLink>
        <IconChevronRight size={12} />
        <DimmedLink to={state.companyAiAgentsPath}>AI Agents</DimmedLink>
      </div>

      <div className="p-4 flex-1 grid grid-cols-2 gap-8 overflow-scroll">
        <div>
          <AgentHeader state={state} />
          <AgentModeToggle state={state} />
          <AgentDefinitionEditor state={state} />
        </div>

        {state.expandedRun ? <AgentRunView state={state} /> : <AgentRunList state={state} />}
      </div>
    </PageNew>
  );
}

function AgentHeader({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar person={state.agent} size={40} />
        <div className="">
          <div className="text-lg font-bold">{state.agent.fullName}</div>
          <div className="flex items-center gap-2 text-sm">{state.agent.title}</div>
        </div>
      </div>
      <div className="">
        <PrimaryButton onClick={state.runAgent} size="sm" loading={state.creatingRun}>
          Run Agent
        </PrimaryButton>
      </div>
    </div>
  );
}

function AgentModeToggle({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md flex items-ceter justify-between gap-4">
      <div>
        <label className="font-bold text-sm mb-1">Sandbox Mode</label>
        <div className="text-xs text-surface-text-secondary max-w-xl">
          When enabled, the agent will not perform any actions that affect the real world. It will have access to the
          same data and context, but will only simulate actions without executing them.
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SwitchToggle label="" value={state.sandboxMode} setValue={state.saveSandboxMode} />
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

function AgentRunList({ state }: { state: ReturnType<typeof usePageState> }) {
  if (state.runs.length === 0) {
    return <div className="text-sm text-surface-text-secondary">No runs yet</div>;
  }

  return (
    <div className="overflow-y-scroll h-full">
      <h3 className="text-lg font-bold mb-2">Runs</h3>
      <ul className="space-y-2">
        {state.runs.map((run) => (
          <li
            key={run.id}
            className="p-2 border border-surface-outline cursor-pointer"
            onClick={() => state.expandRun(run)}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase">
                {run.status} {run.sandboxMode ? "(Sandbox Mode)" : ""}
              </div>
              <div className="text-xs text-surface-text-secondary">
                <FormattedTime time={run.startedAt} format="relative" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentRunView({ state }: { state: State }) {
  if (!state.expandedRun) return null;

  React.useEffect(() => {
    const f = setInterval(state.refreshRun);
    return () => clearInterval(f);
  }, [state.expandedRun]);

  const run = state.expandedRun;

  return (
    <div className="overflow-y-scroll h-full flex flex-col border border-surface-outline">
      <div className="flex items-center justify-between p-2">
        <div className="text-xs uppercase">
          {run.status} {run.sandboxMode ? "(Sandbox Mode)" : ""}
        </div>

        <div className="text-xs text-surface-text-secondary flex items-center gap-2">
          <FormattedTime time={run.startedAt} format="relative" />
          <IconX onClick={() => state.closeRun()} className="cursor-pointer" size={16} />
        </div>
      </div>

      {run.logs && (
        <div className="text-xs border-t border-stroke-base p-2 overflow-y-scroll flex-1">
          <pre className="whitespace-pre-wrap">{run.logs}</pre>
        </div>
      )}
    </div>
  );
}
