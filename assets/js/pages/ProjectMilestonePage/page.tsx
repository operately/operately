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
import { NewTaskModal } from "@/features/Tasks/NewTaskModal";
import { DivLink } from "@/components/Link";

import Avatar from "@/components/Avatar";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider, useDrag, useDrop } from "react-dnd";

export function Page() {
  const refresh = useRefresh();
  const { project, milestone, me } = useLoadedData();

  const form = useFormState(project, milestone);
  const commentsForm = useForMilestone(milestone);

  return (
    <Pages.Page title={[milestone.title, project.name]}>
      <Paper.Root size="large">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <Options form={form} />
          <Header milestone={milestone} form={form} />

          <PageSection title="Description" color="bg-yellow-300">
            <EditDescription form={form} color="bg-yellow-300" />
          </PageSection>
          <Description milestone={milestone} form={form} />

          <TaskSection milestone={milestone} form={form} refresh={refresh} />

          <PageSection title="Comments &amp; Activity Feed" color="bg-purple-200" />
          <CommentSection form={commentsForm} me={me} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageSection({ title, color, children = null }: { title: string; color: string; children?: React.ReactNode }) {
  const textColor = "text-dark-1";

  return (
    <div className="-mx-16 mt-8 mb-4 flex items-center">
      <div className="border-t border-surface-outline w-16" />
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

function AddTask({ onClick, color }) {
  const textColor = "text-dark-1";

  return (
    <>
      <div className="border-t border-surface-outline w-2" />
      <div
        className={
          "text-sm font-bold rounded-full p-1 hover:scale-110 transition cursor-pointer" + " " + color + " " + textColor
        }
        onClick={onClick}
      >
        <Icons.IconPlus size={12} />
      </div>
    </>
  );
}

function TaskSection({ milestone, refresh }) {
  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(false);

  const { data, loading, error } = Tasks.useTasks(milestone.id);

  return (
    <div>
      <PageSection title="Tasks" color="bg-sky-200">
        <AddTask onClick={() => setNewTaskModalOpen(true)} color="bg-sky-200" />
      </PageSection>

      {!loading && !error && data.tasks.length === 0 && (
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
        onSubmit={refresh}
        milestone={milestone}
      />

      {!loading && !error && <TaskBoard tasks={data.tasks} />}
    </div>
  );
}

function TaskBoard({ tasks }: { tasks: Tasks.Task[] }) {
  if (tasks.length === 0) return null;

  const [openTasks, setOpenTasks] = React.useState<Tasks.Task[]>(tasks.filter((t) => t.status === "open"));
  const [inProgressTasks, setInProgressTasks] = React.useState<Tasks.Task[]>(
    tasks.filter((t) => t.status === "in-progress"),
  );
  const [doneTasks, setDoneTasks] = React.useState<Tasks.Task[]>(tasks.filter((t) => t.status === "done"));

  const onTaskDrop = (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === "open") {
      setOpenTasks((tasks) => tasks.filter((t) => t.id !== taskId));
    } else if (task.status === "in-progress") {
      setInProgressTasks((tasks) => tasks.filter((t) => t.id !== taskId));
    } else if (task.status === "done") {
      setDoneTasks((tasks) => tasks.filter((t) => t.id !== taskId));
    }

    task.status = newStatus;

    if (newStatus === "open") {
      setOpenTasks((tasks) => [...tasks, task]);
    } else if (newStatus === "in-progress") {
      setInProgressTasks((tasks) => [...tasks, task]);
    } else if (newStatus === "done") {
      setDoneTasks((tasks) => [...tasks, task]);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-3 gap-2 items-start">
        <TaskColumn title="To Do" tasks={openTasks} color="bg-gray-100" onTaskDrop={onTaskDrop} status="open" />
        <TaskColumn
          title="In Progress"
          tasks={inProgressTasks}
          color="bg-gray-100"
          onTaskDrop={onTaskDrop}
          status="in-progress"
        />
        <TaskColumn title="Done" tasks={doneTasks} color="bg-sky-100" onTaskDrop={onTaskDrop} status="done" />
      </div>
    </DndProvider>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: Tasks.Task[];
  color: string;
  status: string;
  onTaskDrop: (taskId: string, newStatus: string) => void;
}

function TaskColumn(props: TaskColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "task-item",
    drop: (item: { id: string }) => {
      props.onTaskDrop(item.id, props.status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const columnClassName = "p-2 rounded" + " " + props.color;

  return (
    <div className={columnClassName} ref={drop}>
      <div className="text-xs uppercase font-semibold">
        {props.title} {props.tasks.length > 0 && <span>({props.tasks.length})</span>}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {props.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        {props.tasks.length === 0 && <PlaceholderTask />}
      </div>
    </div>
  );
}

function PlaceholderTask() {
  return (
    <div className="text-sm rounded p-2 border-2 border-stroke-base flex items-start justify-between border-dashed h-8"></div>
  );
}

function TaskItem({ task }: { task: Tasks.Task }) {
  const [collected, drag, dragPreview] = useDrag(() => ({
    type: "task-item",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      x: monitor.getClientOffset()?.x,
      y: monitor.getClientOffset()?.y,
    }),
  }));

  if (collected.isDragging) {
    return (
      <div ref={dragPreview}>
        <div className="text-sm bg-surface rounded p-2 border border-stroke-base flex items-start justify-between opacity-50">
          <div className="font-medium">{task.name}</div>

          <div className="text-sm text-content-dimmed flex items-center -space-x-2">
            {task.assignees!.map((a) => (
              <div className="border border-surface rounded-full flex items-center" key={a.id}>
                <Avatar key={a.id} person={a} size={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={drag}>
      <DivLink
        className="text-sm bg-surface rounded p-2 border border-stroke-base flex items-start justify-between"
        to={`/tasks/${task.id}`}
      >
        <div className="font-medium">{task.name}</div>

        <div className="text-sm text-content-dimmed flex items-center -space-x-2">
          {task.assignees!.map((a) => (
            <div className="border border-surface rounded-full flex items-center" key={a.id}>
              <Avatar key={a.id} person={a} size={20} />
            </div>
          ))}
        </div>
      </DivLink>
    </div>
  );
}
