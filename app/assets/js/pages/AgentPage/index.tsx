import Api, { AgentRun, Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";

import {
  Avatar,
  DimmedLink,
  FormattedTime,
  IconChevronRight,
  IconX,
  Modal,
  PageNew,
  PrimaryButton,
  SecondaryButton,
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
  runAgent: () => Promise<void>;
  sandboxMode: boolean;
  saveSandboxMode: (newSandboxMode: boolean) => Promise<void>;
  expandedRun: AgentRun | null;
  expandRun: (runId: AgentRun) => void;
  closeRun: () => void;
  creatingRun: boolean;
  refreshRun: () => void;

  definition: string;
  saveDefiniton: (newDefinition: string) => Promise<void>;
  openEditDefinitionModal: () => void;
  closeEditDefinitionModal: () => void;
  isEditDefinitionModalOpen: boolean;

  planningInstructions: string;
  savePlanningInstructions: (newInstructions: string) => Promise<void>;
  openEditPlanningInstructionsModal: () => void;
  closeEditPlanningInstructionsModal: () => void;
  isEditPlanningInstructionsModalOpen: boolean;

  taskExectionInstructions: string;
  saveTaskExecutionInstructions: (newInstructions: string) => Promise<void>;
  openEditTaskExecutionInstructionsModal: () => void;
  closeEditTaskExecutionInstructionsModal: () => void;
  isEditTaskExecutionInstructionsModalOpen: boolean;
}

function usePageState(): State {
  const { agent, runs: loadedRuns } = Pages.useLoadedData<LoaderResult>();

  const def = agent.agentDef!;

  const [definition, setDefinition] = React.useState<string>(def.definition);
  const [planningInstructions, setPlanningInstructions] = React.useState<string>(def.planningInstructions);
  const [taskExectionInstructions, setTaskExecutionInstructions] = React.useState<string>(
    def.taskExecutionInstructions,
  );

  const [sandboxMode, setSandboxMode] = React.useState<boolean>(def.sandboxMode);
  const [expandedRun, setExpandedRun] = React.useState<AgentRun | null>(null);
  const [runs, setRuns] = React.useState<AgentRun[]>(loadedRuns);
  const [creatingRun, setCreatingRun] = React.useState<boolean>(false);

  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] = React.useState<boolean>(false);
  const [isEditPlanningInstructionsModalOpen, setIsEditPlanningInstructionsModalOpen] = React.useState<boolean>(false);
  const [isEditTaskExecutionInstructionsModalOpen, setIsEditTaskExecutionInstructionsModalOpen] =
    React.useState<boolean>(false);

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

  const savePlanningInstructions = async (newInstructions: string) => {
    const oldInstructions = planningInstructions;

    try {
      setPlanningInstructions(newInstructions);
      await Api.ai.editAgentPlanningInstructions({ id: agent.id, instructions: newInstructions });
      showSuccessToast("Success", "Agent planning instructions updated successfully");
    } catch (error) {
      setPlanningInstructions(oldInstructions);
      showErrorToast("Network error", "Reverting to previous planning instructions");
    }
  };

  const saveTaskExecutionInstructions = async (newInstructions: string) => {
    const oldInstructions = taskExectionInstructions;

    try {
      setTaskExecutionInstructions(newInstructions);
      await Api.ai.editAgentTaskExecutionInstructions({ id: agent.id, instructions: newInstructions });
      showSuccessToast("Success", "Agent task execution instructions updated successfully");
    } catch (error) {
      setTaskExecutionInstructions(oldInstructions);
      showErrorToast("Network error", "Reverting to previous task execution instructions");
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
    runAgent,
    sandboxMode,
    saveSandboxMode,
    expandedRun,
    expandRun,
    closeRun,
    creatingRun,
    refreshRun,

    definition,
    saveDefiniton,
    isEditDefinitionModalOpen,
    openEditDefinitionModal: () => setIsEditDefinitionModalOpen(true),
    closeEditDefinitionModal: () => setIsEditDefinitionModalOpen(false),

    planningInstructions,
    savePlanningInstructions,
    isEditPlanningInstructionsModalOpen,
    openEditPlanningInstructionsModal: () => setIsEditPlanningInstructionsModalOpen(true),
    closeEditPlanningInstructionsModal: () => setIsEditPlanningInstructionsModalOpen(false),

    taskExectionInstructions,
    saveTaskExecutionInstructions,
    isEditTaskExecutionInstructionsModalOpen,
    openEditTaskExecutionInstructionsModal: () => setIsEditTaskExecutionInstructionsModalOpen(true),
    closeEditTaskExecutionInstructionsModal: () => setIsEditTaskExecutionInstructionsModalOpen(false),
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
          <AgentDefinition state={state} />
          <PlanningInstructions state={state} />
          <SandboxModeToggle state={state} />
          <DailyRunToggle state={state} />
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

function SandboxModeToggle({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md flex items-ceter justify-between gap-4">
      <div>
        <label className="font-bold text-sm mb-1">Sandbox Mode</label>
        <div className="text-xs text-surface-text-secondary max-w-xl">
          When enabled, the agent will not perform any actions that affect the real world, but will instead simulate
          actions and responses. The agent will have access to the same data and capabilities, but will not post any
          messages or perform any actions.
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SwitchToggle label="" value={state.sandboxMode} setValue={state.saveSandboxMode} />
      </div>
    </div>
  );
}

function DailyRunToggle({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md flex items-ceter justify-between gap-4">
      <div>
        <label className="font-bold text-sm mb-1">Run Daily</label>
        <div className="text-xs text-surface-text-secondary max-w-xl">
          When enabled, the agent will automatically run every day at a 9am UTC. This is useful for agents that need to
          perform daily tasks or checks.
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SwitchToggle label="" value={state.sandboxMode} setValue={state.saveSandboxMode} />
      </div>
    </div>
  );
}

function AgentDefinition({ state }: { state: ReturnType<typeof usePageState> }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">Responsibilities</label>
        <SecondaryButton size="xxs" onClick={state.openEditDefinitionModal}>
          Edit
        </SecondaryButton>
      </div>

      <p className="mt-2 text-xs line-clamp-4">{state.definition}</p>

      <AgentDefinitionEditModal state={state} />
    </div>
  );
}

function AgentDefinitionEditModal({ state }: { state: ReturnType<typeof usePageState> }) {
  const [buffer, setBuffer] = React.useState(state.definition);

  return (
    <Modal
      title="Edit Agent Definition"
      isOpen={state.isEditDefinitionModalOpen}
      onClose={state.closeEditDefinitionModal}
      closeOnBackdropClick={false}
      size="large"
    >
      <textarea
        className="w-full p-2 border border-surface-outline rounded-md text-xs"
        rows={30}
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        placeholder="Enter agent definition here..."
      />

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton size="sm" onClick={state.closeEditDefinitionModal}>
          Cancel
        </SecondaryButton>
        <PrimaryButton size="sm" onClick={() => state.saveDefiniton(buffer)}>
          Save
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function PlanningInstructions({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">Planning Instructions</label>
        <SecondaryButton size="xxs" onClick={state.openEditPlanningInstructionsModal}>
          Edit
        </SecondaryButton>
      </div>

      <p className="mt-2 text-xs line-clamp-4">{state.planningInstructions}</p>

      <AgentDefinitionEditModal state={state} />
    </div>
  );
}

function PlanningInstructionsEditModal({ state }: { state: State }) {
  const [buffer, setBuffer] = React.useState(state.planningInstructions);

  return (
    <Modal
      title="Edit Agent Definition"
      isOpen={state.isEditPlanningInstructionsModalOpen}
      onClose={state.closeEditPlanningInstructionsModal}
      closeOnBackdropClick={false}
      size="large"
    >
      <textarea
        className="w-full p-2 border border-surface-outline rounded-md text-xs"
        rows={30}
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        placeholder="Enter agent definition here..."
      />

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton size="sm" onClick={state.closeEditPlanningInstructionsModal}>
          Cancel
        </SecondaryButton>
        <PrimaryButton size="sm" onClick={() => state.savePlanningInstructions(buffer)}>
          Save
        </PrimaryButton>
      </div>
    </Modal>
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
    const f = setInterval(state.refreshRun, 2000);
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
