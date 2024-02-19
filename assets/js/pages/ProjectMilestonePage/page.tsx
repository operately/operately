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

function TaskSection({ milestone }) {
  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(false);

  const { data, loading, error, refetch } = Tasks.useTasks(milestone.id);

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
        onSubmit={refetch}
        milestone={milestone}
      />

      {!loading && !error && <TaskBoard tasks={data.tasks} />}
    </div>
  );
}

interface TaskBoardState {
  openTasks: Tasks.Task[];
  inProgressTasks: Tasks.Task[];
  doneTasks: Tasks.Task[];
}

import { insertAt } from "@/utils/array";
import { DragAndDropProvider, useDraggable, useDropZone, useDragAndDropContext } from "@/features/DragAndDrop";

function TaskBoard({ tasks }: { tasks: Tasks.Task[] }) {
  if (tasks.length === 0) return null;

  const [taskBoardState, setTaskBoardState] = React.useState<TaskBoardState>({
    openTasks: tasks.filter((t) => t.status === "open"),
    inProgressTasks: tasks.filter((t) => t.status === "in-progress"),
    doneTasks: tasks.filter((t) => t.status === "done"),
  });

  React.useEffect(() => {
    setTaskBoardState({
      openTasks: tasks.filter((t) => t.status === "open"),
      inProgressTasks: tasks.filter((t) => t.status === "in-progress"),
      doneTasks: tasks.filter((t) => t.status === "done"),
    });
  }, [tasks]);

  const onTaskDrop = (dropZoneId: string, taskId: string, indexInDropZone: number) => {
    setTaskBoardState((prev) => {
      const { openTasks, inProgressTasks, doneTasks } = prev;

      const task =
        openTasks.find((t) => t.id === taskId) ||
        inProgressTasks.find((t) => t.id === taskId) ||
        doneTasks.find((t) => t.id === taskId);

      if (!task) return prev;

      let newOpenTasks = openTasks.filter((t) => t.id !== taskId);
      let newInProgressTasks = inProgressTasks.filter((t) => t.id !== taskId);
      let newDoneTasks = doneTasks.filter((t) => t.id !== taskId);

      task.status = dropZoneId;

      if (dropZoneId === "open") {
        newOpenTasks = insertAt(newOpenTasks, indexInDropZone, task);
      } else if (dropZoneId === "in-progress") {
        newInProgressTasks = insertAt(newInProgressTasks, indexInDropZone, task);
      } else if (dropZoneId === "done") {
        newDoneTasks = insertAt(newDoneTasks, indexInDropZone, task);
      }

      return { openTasks: newOpenTasks, inProgressTasks: newInProgressTasks, doneTasks: newDoneTasks };
    });
  };

  return (
    <DragAndDropProvider onDrop={onTaskDrop}>
      <div className="grid grid-cols-3 gap-2 items-start">
        <TaskColumn
          title="To Do"
          tasks={taskBoardState.openTasks}
          color="bg-gray-100"
          onTaskDrop={onTaskDrop}
          status="open"
        />
        <TaskColumn
          title="In Progress"
          tasks={taskBoardState.inProgressTasks}
          color="bg-gray-100"
          onTaskDrop={onTaskDrop}
          status="in-progress"
        />
        <TaskColumn
          title="Done"
          tasks={taskBoardState.doneTasks}
          color="bg-sky-100"
          onTaskDrop={onTaskDrop}
          status="done"
        />
      </div>
    </DragAndDropProvider>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: Tasks.Task[];
  color: string;
  status: string;
  onTaskDrop: (taskId: string, newStatus: string, index: number) => void;
}

function TaskColumn(props: TaskColumnProps) {
  const { draggedId } = useDragAndDropContext();
  const { ref, isOver, isSourceZone, dropIndex, draggedElementHeight } = useDropZone({ id: props.status });

  const [animate, setAnimate] = React.useState(false);

  React.useLayoutEffect(() => {
    if (draggedId !== null) {
      setTimeout(() => setAnimate(true), 200);
    } else {
      setAnimate(false);
    }
  }, [draggedId]);

  const columnClassName = "p-2 rounded" + " " + props.color;
  const style = {
    paddingBottom: isOver && !isSourceZone ? draggedElementHeight! : 0,
    transition: animate && !isSourceZone ? "padding 0.2s ease-in-out" : "",
  };

  const taskStyle = (index: number) => {
    if (!isOver) return {};

    return {
      transform: `translateY(${index < dropIndex! ? 0 : draggedElementHeight!}px)`,
      transition: animate ? "transform 0.2s ease-in-out" : "",
    };
  };

  const visibleIndexes = React.useMemo(() => {
    let res = {};

    if (!isOver) {
      props.tasks.forEach((t, i) => (res[t.id] = i));
    } else {
      props.tasks.filter((t) => t.id !== draggedId).forEach((t, i) => (res[t.id] = i));
    }

    return res;
  }, [isOver, draggedId, props.tasks.length]);

  return (
    <div className={columnClassName}>
      <div className="text-xs uppercase font-semibold">
        {props.title} {props.tasks.length > 0 && <span>({props.tasks.length})</span>}
      </div>

      <div className="flex flex-col mt-2" ref={ref} style={style}>
        {props.tasks.map((task) => (
          <TaskItem key={task.id} task={task} zoneId={props.status} style={taskStyle(visibleIndexes[task.id])} />
        ))}

        {props.tasks.length === 0 && <PlaceholderTask />}
      </div>
    </div>
  );
}

function TaskItem({ task, zoneId, style }: { task: Tasks.Task; zoneId: string; style: React.CSSProperties }) {
  const { ref, isDragging } = useDraggable({ id: task.id, zoneId });

  return (
    <div className="w-full" ref={ref}>
      <div className="my-1" style={isDragging ? {} : style}>
        <DivLink
          className="text-sm bg-surface rounded p-2 border border-stroke-base flex items-start justify-between cursor-pointer"
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
    </div>
  );
}

function PlaceholderTask() {
  return (
    <div className="text-sm rounded p-2 border-2 border-stroke-base flex items-start justify-between border-dashed h-8"></div>
  );
}
