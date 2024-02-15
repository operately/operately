import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useLoadedData, useRefresh } from "./loader";
import { useFormState } from "./useForm";

import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { Options } from "./Options";
import { Header } from "./Header";
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
          <Options form={form} />
          <Header milestone={milestone} form={form} />

          <PageSection title="Description" color="bg-yellow-300">
            <EditDescription form={form} color="bg-yellow-300" />
          </PageSection>
          <Description milestone={milestone} form={form} />

          <PageSection title="Tasks" color="bg-red-300" />
          <Tasks milestone={milestone} form={form} refresh={refresh} />

          <PageSection title="Comments &amp; Activity Feed" color="bg-sky-200" />
          <CommentSection form={commentsForm} me={me} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageSection({ title, color, children = null }: { title: string; color: string; children?: React.ReactNode }) {
  const textColor = "text-dark-1";

  return (
    <div className="-mx-12 mt-8 mb-4 flex items-center">
      <div className="border-t border-surface-outline w-12" />
      <div className={"text-sm font-bold rounded px-1.5 tracking-wide" + " " + color + " " + textColor}>{title}</div>
      {children}
      <div className="border-t border-surface-outline flex-1" />
    </div>
  );
}

function EditDescription({ form, color }) {
  const textColor = "text-dark-1";

  return (
    <>
      <div className="border-t border-surface-outline w-2" />
      <div
        className={
          "text-sm font-bold rounded-full p-1 hover:scale-110 transition cursor-pointer" + " " + color + " " + textColor
        }
        onClick={() => form.description.startEditing()}
      >
        <Icons.IconPencil size={12} />
      </div>
    </>
  );
}

function Tasks({ milestone, form, refresh }) {
  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(true);

  return (
    <div>
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
