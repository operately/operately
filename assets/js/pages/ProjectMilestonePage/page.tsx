import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useRefresh } from "./loader";
import { useFormState } from "./useForm";

import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { Title } from "./Title";
import { Overview } from "./Overview";
import { Description } from "./Description";
import { CommentSection, useForMilestone } from "@/features/CommentSection";
import { FilledButton } from "@/components/Button";
import { NewTaskModal } from "@/features/Tasks/NewTaskModal";

export function Page() {
  const refresh = useRefresh();
  const { project, milestone, me } = useLoadedData();

  const form = useFormState(project, milestone);
  const commentsForm = useForMilestone(milestone);

  return (
    <Pages.Page title={[milestone.title, project.name]}>
      <Paper.Root size="medium">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <Title milestone={milestone} form={form} />
          <Overview milestone={milestone} form={form} />

          <div className="border-b border-surface-outline -mx-12 mt-12 mb-8" />
          <Description milestone={milestone} form={form} />

          <div className="border-b border-surface-outline -mx-12 mt-12 mb-8" />
          <Tasks milestone={milestone} form={form} refresh={refresh} />

          <div className="border-b border-surface-outline -mx-12 mt-12 mb-8" />
          <CommentSection form={commentsForm} me={me} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Tasks({ milestone, form, refresh }) {
  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(false);

  return (
    <div>
      <div className="flex items-center justify-left">
        <div className="font-bold -mt-[66px] bg-sky-300 rounded px-2 text-sm">Tasks</div>
      </div>

      <div className="flex justify-between mb-6">
        <FilledButton size="xs" type="secondary" onClick={() => setNewTaskModalOpen(true)}>
          Add Task
        </FilledButton>
      </div>

      <NewTaskModal
        modalTitle={`Adding a new task to ${milestone.title}`}
        isOpen={newTaskModalOpen}
        hideModal={() => setNewTaskModalOpen(false)}
        onSubmit={refresh}
        milestone={milestone}
      />
    </div>
  );
}
