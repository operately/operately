import Api, { AgentRun, Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";
import type { LoaderResult } from "./index";

import { showErrorToast, showSuccessToast } from "turboui";
import { usePaths } from "../../routes/paths";

export interface State {
  agent: Person;
  runs: AgentRun[];
  companyAdminPath: string;
  companyAiAgentsPath: string;
  runAgent: () => Promise<void>;
  expandedRun: AgentRun | null;
  expandRun: (runId: AgentRun) => void;
  closeRun: () => void;
  creatingRun: boolean;
  refreshRun: () => void;

  definition: DefinitionState;
  planningInstructions: PlanningInstructionsState;
  taskExectionInstructions: TaskExecutionInstructionsState;
  sandboxMode: SandboxModeState;
  dailyRun: DailyRunState;
  verboseLogs: VerboseLogsState;
}

export function usePageState(): State {
  const { agent, runs: loadedRuns } = Pages.useLoadedData<LoaderResult>();

  const [expandedRun, setExpandedRun] = React.useState<AgentRun | null>(null);
  const [runs, setRuns] = React.useState<AgentRun[]>(loadedRuns);
  const [creatingRun, setCreatingRun] = React.useState<boolean>(false);

  const paths = usePaths();
  const companyAdminPath = paths.companyAdminPath();
  const companyAiAgentsPath = paths.companyAiAgentsPath();

  const dailyRun = useDailyRun();
  const sandboxMode = useSandboxMode();
  const definition = useDefinition();
  const planningInstructions = usePlanningInstructions();
  const taskExectionInstructions = useTaskExecutionInstructions();
  const verboseLogs = useVerboseLogs();

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
    expandedRun,
    expandRun,
    closeRun,
    creatingRun,
    refreshRun,

    dailyRun,
    sandboxMode,
    definition,
    planningInstructions,
    taskExectionInstructions,
    verboseLogs,
  };
}

interface DefinitionState {
  value: string;
  save: (newDefinition: string) => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

function useDefinition(): DefinitionState {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const [value, setValue] = React.useState<string>(agent.agentDef!.definition);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const save = async (newDefinition: string) => {
    const oldValue = value;

    try {
      await Api.ai.editAgentDefinition({ id: agent.id, definition: newDefinition });
      setValue(newDefinition);
      showSuccessToast("Success", "Agent definition updated successfully");
      closeModal();
    } catch (error) {
      setValue(oldValue);
      showErrorToast("Network error", "Reverting to previous definition");
    }
  };

  return {
    value,
    save,
    isModalOpen,
    openModal,
    closeModal,
  };
}

interface PlanningInstructionsState {
  value: string;
  save: (newInstructions: string) => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

function usePlanningInstructions(): PlanningInstructionsState {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const [value, setValue] = React.useState<string>(agent.agentDef!.planningInstructions);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const save = async (newInstructions: string) => {
    const oldValue = value;

    try {
      await Api.ai.editAgentPlanningInstructions({ id: agent.id, instructions: newInstructions });
      setValue(newInstructions);
      showSuccessToast("Success", "Agent planning instructions updated successfully");
      closeModal();
    } catch (error) {
      setValue(oldValue);
      showErrorToast("Network error", "Reverting to previous planning instructions");
    }
  };

  return {
    value,
    save,
    isModalOpen,
    openModal,
    closeModal,
  };
}

interface TaskExecutionInstructionsState {
  value: string;
  save: (newInstructions: string) => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

function useTaskExecutionInstructions(): TaskExecutionInstructionsState {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const [value, setValue] = React.useState<string>(agent.agentDef!.taskExecutionInstructions);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const save = async (newInstructions: string) => {
    const oldValue = value;

    try {
      await Api.ai.editAgentTaskExecutionInstructions({ id: agent.id, instructions: newInstructions });
      setValue(newInstructions);
      showSuccessToast("Success", "Agent task execution instructions updated successfully");
      closeModal();
    } catch (error) {
      setValue(oldValue);
      showErrorToast("Network error", "Reverting to previous task execution instructions");
    }
  };

  return {
    value,
    save,
    isModalOpen,
    openModal,
    closeModal,
  };
}

interface SandboxModeState {
  sandboxMode: boolean;
  save: (newSandboxMode: boolean) => Promise<void>;
}

function useSandboxMode(): SandboxModeState {
  const { agent } = Pages.useLoadedData<LoaderResult>();
  const [sandboxMode, setSandboxMode] = React.useState<boolean>(agent.agentDef!.sandboxMode);

  const save = async (newSandboxMode: boolean) => {
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

  return {
    sandboxMode,
    save,
  };
}

interface DailyRunState {
  value: boolean;
  setValue: (newEnabled: boolean) => Promise<void>;
}

function useDailyRun(): DailyRunState {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const [value, setEnabled] = React.useState<boolean>(agent.agentDef!.dailyRun);

  React.useEffect(() => {
    setEnabled(agent.agentDef!.dailyRun);
  }, [agent.agentDef!.dailyRun]);

  const setValue = async (newEnabled: boolean) => {
    const oldEnabled = value;

    try {
      setEnabled(newEnabled);
      await Api.ai.editAgentDailyRun({ id: agent.id, enabled: newEnabled });
      showSuccessToast("Success", "Daily run updated successfully");
    } catch (error) {
      setEnabled(oldEnabled);
      showErrorToast("Network error", "Reverting to previous daily run setting");
    }
  };

  return {
    value,
    setValue: setValue,
  };
}

interface VerboseLogsState {
  value: boolean;
  setValue: (newEnabled: boolean) => Promise<void>;
}

function useVerboseLogs(): VerboseLogsState {
  const { agent } = Pages.useLoadedData<LoaderResult>();

  const [value, setEnabled] = React.useState<boolean>(agent.agentDef!.verboseLogs);

  React.useEffect(() => {
    setEnabled(agent.agentDef!.verboseLogs);
  }, [agent.agentDef!.verboseLogs]);

  const setValue = async (newEnabled: boolean) => {
    const oldEnabled = value;

    try {
      setEnabled(newEnabled);
      await Api.ai.editAgentVerbosity({ id: agent.id, verbose: newEnabled });
      showSuccessToast("Success", "Verbose logs setting updated successfully");
    } catch (error) {
      setEnabled(oldEnabled);
      showErrorToast("Network error", "Reverting to previous verbose logs setting");
    }
  };

  return {
    value,
    setValue: setValue,
  };
}
