import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Tasks from "@/models/tasks";

import { useLoadedData, useRefresh } from "./loader";
import { useFormState } from "./useForm";

import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { Description } from "./Description";
import { CommentSection, useForMilestone } from "@/features/CommentSection";
import { FilledButton } from "@/components/Button";
import { TaskBoard } from "@/features/Tasks/TaskBoard";
import { NewTaskModal } from "@/features/Tasks/NewTaskModal";

import classNames from "classnames";

export function Page() {
  const refresh = useRefresh();
  const { project, milestone } = useLoadedData();

  const form = useFormState(project, milestone);
  const commentsForm = useForMilestone(milestone);

  return (
    <Pages.Page title={[milestone.title!, project.name!]}>
      <Paper.Root size="large">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <Options form={form} />
          <Header milestone={milestone} form={form} />

          <PageSection title="Description">
            <EditDescription form={form} />
          </PageSection>
          <Description milestone={milestone} form={form} />

          <TaskSection milestone={milestone} />

          <PageSection title="Comments &amp; Activity Feed" />
          <CommentSection form={commentsForm} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageSection({ title, children = null }: { title: string; children?: React.ReactNode }) {
  const { negHor } = Paper.usePaperSizeHelpers();
  return (
    <div className={classNames("mt-8 mb-4 flex items-center", negHor)}>
      <div className="border-t border-surface-outline w-12" />
      <div className={"font-bold rounded px-1.5"}>{title}</div>
      {children}
      <div className="ml-2 flex-1 border-t border-surface-outline" />
    </div>
  );
}

function EditDescription({ form }) {
  return (
    <>
      <div
        className={"text-sm font-bold rounded-full p-1 hover:scale-110 transition cursor-pointer bg-sky-200"}
        onClick={() => form.description.startEditing()}
      >
        <Icons.IconPencil size={14} />
      </div>
    </>
  );
}

function AddTask({ onClick }) {
  return (
    <>
      <div
        className={"text-sm font-bold rounded-full p-1 hover:scale-110 transition cursor-pointer bg-sky-200"}
        onClick={onClick}
      >
        <Icons.IconPlus size={14} />
      </div>
    </>
  );
}

function TaskSection({ milestone }) {
  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(false);
  const { data, loading, error, refetch } = Tasks.useGetTasks({
    milestoneId: milestone.id!,
    includeAssignees: true,
  });

  const tasks = data?.tasks || [];
  const showAddFirstTask = !loading && !error && tasks.length === 0;

  return (
    <div>
      <PageSection title="Tasks">
        <AddTask onClick={() => setNewTaskModalOpen(true)} />
      </PageSection>

      {showAddFirstTask && (
        <div className="flex justify-between mb-6">
          <FilledButton size="xs" type="secondary" onClick={() => setNewTaskModalOpen(true)}>
            Add First Task
          </FilledButton>
        </div>
      )}

      <NewTaskModal
        modalTitle={`Adding a new task to ${milestone.title}`}
        isOpen={newTaskModalOpen}
        hideModal={() => setNewTaskModalOpen(false)}
        onSubmit={refetch}
        milestone={milestone}
      />

      {tasks.length > 0 && <TaskBoard tasks={tasks} kanbanState={milestone.tasksKanbanState} />}
    </div>
  );
}
