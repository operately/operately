import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { IconPencil, IconPlus } from "turboui";
import * as Tasks from "@/models/tasks";

import { useLoadedData, useRefresh } from "./loader";
import { useFormState } from "./useForm";

import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { Description } from "./Description";
import { CommentSection, useForMilestone } from "@/features/CommentSection";
import { SecondaryButton } from "turboui";
import { TaskBoard } from "@/features/Tasks/TaskBoard";
import { NewTaskModal } from "@/features/Tasks/NewTaskModal";

import classNames from "classnames";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { milestone } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(milestone.project, "project must be present in milestone");
  assertPresent(milestone.permissions?.canCommentOnMilestone, "permissions must be present in milestone");

  const form = useFormState(milestone.project, milestone);
  const commentsForm = useForMilestone(milestone, refresh);

  return (
    <Pages.Page title={[milestone.title!, milestone.project.name!]}>
      <Paper.Root size="large">
        <ProjectMilestonesNavigation project={milestone.project} />

        <Paper.Body minHeight="none">
          <Options form={form} />
          <Header milestone={milestone} form={form} />

          <PageSection title="Description">
            <EditDescription form={form} />
          </PageSection>
          <Description milestone={milestone} form={form} />

          <TaskSection milestone={milestone} />

          <PageSection title="Comments &amp; Activity Feed" />
          <CommentSection
            form={commentsForm}
            commentParentType="milestone"
            canComment={milestone.permissions.canCommentOnMilestone}
          />
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
        <IconPencil size={14} />
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
        data-test-id="add-task"
      >
        <IconPlus size={14} />
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
          <SecondaryButton size="xs" onClick={() => setNewTaskModalOpen(true)}>
            Add First Task
          </SecondaryButton>
        </div>
      )}

      <NewTaskModal
        isOpen={newTaskModalOpen}
        hideModal={() => setNewTaskModalOpen(false)}
        onSubmit={refetch}
        milestone={milestone}
      />

      {tasks.length > 0 && <TaskBoard tasks={tasks} kanbanState={milestone.tasksKanbanState} />}
    </div>
  );
}
