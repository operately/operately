import Api, { AgentRun, Person } from "@/api";

import * as React from "react";

import {
  Avatar,
  DimmedLink,
  FormattedTime,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronRight,
  IconX,
  Modal,
  PageNew,
  PrimaryButton,
  SecondaryButton,
  SwitchToggle,
} from "turboui";

import { PageModule } from "@/routes/types";
import { State, usePageState } from "./state";

export default { name: "CompanyManageAiAgentsPage", loader, Page } as PageModule;

export interface LoaderResult {
  agent: Person;
  runs: AgentRun[];
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    agent: await Api.ai.getAgent({ id: params.id }).then((d) => d.agent),
    runs: await Api.ai.listAgentRuns({ agentId: params.id }).then((d) => d.runs),
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

      <div className="p-4 flex-1 grid grid-cols-2 gap-8 overflow-auto">
        <div>
          <AgentHeader state={state} />
          <AgentDefinition state={state} />
          <PlanningInstructions state={state} />
          <TaskExecutionInstructions state={state} />
          <SandboxModeToggle state={state} />
          <DailyRunToggle state={state} />
          <VerboseLogsToggle state={state} />
          <ProviderSelector state={state} />
        </div>

        {state.expandedRun ? <AgentRunView state={state} /> : <AgentRunList state={state} />}
      </div>
    </PageNew>
  );
}

function AgentHeader({ state }: { state: State }) {
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

function SandboxModeToggle({ state }: { state: State }) {
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
        <SwitchToggle label="" value={state.sandboxMode.sandboxMode} setValue={state.sandboxMode.save} />
      </div>
    </div>
  );
}

function DailyRunToggle({ state }: { state: State }) {
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
        <SwitchToggle label="" value={state.dailyRun.value} setValue={state.dailyRun.setValue} />
      </div>
    </div>
  );
}

function VerboseLogsToggle({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md flex items-center justify-between gap-4">
      <div>
        <label className="font-bold text-sm mb-1">Verbose Logs</label>
        <div className="text-xs text-surface-text-secondary max-w-xl">
          When enabled, the agent will produce detailed logs for each run. This is useful for debugging and
          understanding agent behavior.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SwitchToggle label="" value={state.verboseLogs.value} setValue={state.verboseLogs.setValue} />
      </div>
    </div>
  );
}

function AgentDefinition({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">Responsibilities</label>
        <SecondaryButton size="xxs" onClick={state.definition.openModal}>
          Edit
        </SecondaryButton>
      </div>

      <p className="mt-2 text-xs line-clamp-4">{state.definition.value}</p>

      <EditInstructionsModal
        title="Edit Agent Definition"
        isOpen={state.definition.isModalOpen}
        onClose={state.definition.closeModal}
        value={state.definition.value}
        setValue={state.definition.save}
      />
    </div>
  );
}

function PlanningInstructions({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">Planning Instructions</label>
        <SecondaryButton size="xxs" onClick={state.planningInstructions.openModal}>
          Edit
        </SecondaryButton>
      </div>

      <p className="mt-2 text-xs line-clamp-4">{state.planningInstructions.value}</p>

      <EditInstructionsModal
        title="Edit Planning Instructions"
        isOpen={state.planningInstructions.isModalOpen}
        onClose={state.planningInstructions.closeModal}
        value={state.planningInstructions.value}
        setValue={state.planningInstructions.save}
      />
    </div>
  );
}

function TaskExecutionInstructions({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">Task Execution Instructions</label>
        <SecondaryButton size="xxs" onClick={state.taskExectionInstructions.openModal}>
          Edit
        </SecondaryButton>
      </div>

      <p className="mt-2 text-xs line-clamp-4">{state.taskExectionInstructions.value}</p>

      <EditInstructionsModal
        title="Edit Task Execution Instructions"
        isOpen={state.taskExectionInstructions.isModalOpen}
        onClose={state.taskExectionInstructions.closeModal}
        value={state.taskExectionInstructions.value}
        setValue={state.taskExectionInstructions.save}
      />
    </div>
  );
}

function EditInstructionsModal({
  title,
  isOpen,
  onClose,
  value,
  setValue,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  value: string;
  setValue: (newValue: string) => void;
}) {
  const [buffer, setBuffer] = React.useState(value);

  React.useEffect(() => {
    setBuffer(value);
  }, [value]);

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose} closeOnBackdropClick={false} size="large">
      <textarea
        className="w-full p-2 border border-surface-outline rounded-md text-xs bg-surface-base text-content-base placeholder-content-subtle focus:outline-none focus:ring-1 focus:ring-accent-1"
        rows={30}
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        placeholder="Enter instructions"
      />

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton size="sm" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton size="sm" onClick={() => setValue(buffer)}>
          Save
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function AgentRunList({ state }: { state: State }) {
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

  //
  // Determine the class based on whether the run is maximized or not
  // If maximized, it takes the full screen, otherwise it is a scrollable container
  //
  const normal = "overflow-y-scroll h-full flex flex-col border border-surface-outline";
  const maximized = "fixed inset-0 z-50 bg-surface-base flex flex-col";
  const klass = state.expandedRunFullscreen ? maximized : normal;

  return (
    <div className={klass}>
      <div className="flex items-center justify-between p-2">
        <div className="text-xs uppercase">
          {run.status} {run.sandboxMode ? "(Sandbox Mode)" : ""}
        </div>

        <div className="text-xs text-surface-text-secondary flex items-center gap-2">
          <FormattedTime time={run.startedAt} format="relative" />
          <FullscreenButton state={state} />
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

function FullscreenButton({ state }: { state: State }) {
  const Icon = state.expandedRunFullscreen ? IconArrowsMinimize : IconArrowsMaximize;

  return <Icon onClick={state.toggleExpandedRunFullscreen} className="cursor-pointer" size={14} />;
}

function ProviderSelector({ state }: { state: State }) {
  return (
    <div className="mt-6 p-4 border border-surface-outline rounded-md flex items-center justify-between gap-4">
      <div>
        <label className="font-bold text-sm mb-1">LLM Provider</label>
        <div className="text-xs text-surface-text-secondary max-w-xl">
          Select the provider for the LLM used by this agent. This will determine the capabilities and behavior of the
          agent.
        </div>
      </div>

      <select
        className="border border-surface-outline rounded-md p-2 text-xs"
        value={state.provider.value}
        onChange={(e) => state.provider.setValue(e.target.value)}
      >
        <option value="openai">OpenAI</option>
        <option value="claude">Claude</option>
      </select>
    </div>
  );
}
