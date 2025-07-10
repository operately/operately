import Api, { Person } from "@/api";

import * as Pages from "@/components/Pages";
import * as React from "react";

import {
  AvatarWithName,
  DimmedLink,
  DivLink,
  InfoCallout,
  Modal,
  PageNew,
  PrimaryButton,
  SecondaryButton,
  showErrorToast,
  TextField,
} from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "../../routes/paths";

export default { name: "CompanyManageAiAgentsPage", loader, Page } as PageModule;

interface LoaderResult {
  agents: Person[];
}

export async function loader({}): Promise<LoaderResult> {
  return {
    agents: await Api.ai.listAgents({}).then((d) => d.agents),
  };
}

function usePageState() {
  const { agents } = Pages.useLoadedData<LoaderResult>();

  const refresh = Pages.useRefresh();
  const paths = usePaths();
  const companyAdminPath = paths.companyAdminPath();

  const [isAddNewModalOpen, setAddNewModalOpen] = React.useState(false);
  const closeAddNewModal = () => setAddNewModalOpen(false);
  const openAddNewModal = () => setAddNewModalOpen(true);

  const createNewAgent = async (name: string, title: string) => {
    try {
      await Api.ai.addAgent({ fullName: name, title: title });

      refresh();
      closeAddNewModal();
    } catch (error) {
      showErrorToast("Network error", "Failed to create new agent. Please try again later.");
    }
  };

  return {
    agents,
    companyAdminPath,
    isAddNewModalOpen,
    closeAddNewModal,
    openAddNewModal,
    createNewAgent,
  };
}

export function Page() {
  const state = usePageState();

  return (
    <PageNew title="Manage AI Agents">
      <AddNewModal state={state} />

      <div className="p-4">
        <div className="text-sm">
          <DimmedLink to={state.companyAdminPath}>&lt;- Company Admin</DimmedLink>
        </div>

        <div className="max-w-xl mx-auto mt-4">
          <div className="flex items-center gap-2 justify-between">
            <div className="text-3xl font-bold">AI Agents</div>
            <PrimaryButton size="sm" onClick={state.openAddNewModal}>
              Add Agent
            </PrimaryButton>
          </div>

          {state.agents.length === 0 && (
            <div className="max-w-lg mx-auto mt-4">
              <InfoCallout
                message={"No AI agents"}
                description={
                  "AI Agents are automated assistants that can help with various tasks within your company." +
                  " They can be configured to perform specific actions or provide information based on your needs."
                }
              />
            </div>
          )}

          <div className="mt-8">
            {state.agents.map((agent) => (
              <DivLink
                key={agent.id}
                className="block first:border-t border-b border-stroke-base py-3 px-1 hover:bg-surface-highlight"
                to={`/company/ai-agents/${agent.id}`}
              >
                <AvatarWithName size={40} person={agent} title={agent.title} />
              </DivLink>
            ))}
          </div>
        </div>
      </div>
    </PageNew>
  );
}

function AddNewModal({ state }: { state: ReturnType<typeof usePageState> }) {
  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [titleError, setTitleError] = React.useState("");

  const submit = async () => {
    if (!name) {
      setNameError("Agent name is required.");
    }

    if (!title) {
      setTitleError("Title is required.");
    }

    if (!name || !title) {
      return;
    }

    await state.createNewAgent(name, title);

    setName("");
    setNameError("");
    setTitle("");
    setTitleError("");
  };

  return (
    <Modal isOpen={state.isAddNewModalOpen} onClose={state.closeAddNewModal}>
      <form onSubmit={submit}>
        <div className="text-lg font-bold mb-2">Create a new AI Agent</div>
        <div className="text-sm text-content-secondary mb-4">
          Automate tasks and provide assistance within your company.
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            text={name}
            onChange={setName}
            label="Agent Name"
            placeholder="e.g. Alfred Iverson"
            variant="form-field"
            error={nameError}
          />

          <TextField
            text={title}
            onChange={setTitle}
            label="Title"
            placeholder="e.g. Chief Operating Officer"
            variant="form-field"
            error={titleError}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <PrimaryButton size="sm" type="submit">
            Create Agent
          </PrimaryButton>

          <SecondaryButton onClick={state.closeAddNewModal} size="sm">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
