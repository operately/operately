import * as React from "react";
import * as Tasks from "@/models/tasks";

import Avatar from "@/components/Avatar";

import { DivLink } from "@/components/Link";
import { insertAt } from "@/utils/array";
import { DragAndDropProvider, useDraggable, useDropZone, useDragAndDropContext } from "@/features/DragAndDrop";
import { Paths, compareIds } from "@/routes/paths";

interface TaskBoardState {
  todoTasks: Tasks.Task[];
  inProgressTasks: Tasks.Task[];
  doneTasks: Tasks.Task[];
}

export function TaskBoard({ tasks, kanbanState }: { tasks: Tasks.Task[]; kanbanState: any }) {
  const [taskBoardState, setTaskBoardState] = React.useState<TaskBoardState>({
    todoTasks: orderTasksByKanbanState(tasks, kanbanState, "todo"),
    inProgressTasks: orderTasksByKanbanState(tasks, kanbanState, "in_progress"),
    doneTasks: orderTasksByKanbanState(tasks, kanbanState, "done"),
  });

  React.useEffect(() => {
    setTaskBoardState({
      todoTasks: orderTasksByKanbanState(tasks, kanbanState, "todo"),
      inProgressTasks: orderTasksByKanbanState(tasks, kanbanState, "in_progress"),
      doneTasks: orderTasksByKanbanState(tasks, kanbanState, "done"),
    });
  }, [tasks]);

  const [changeStatus] = Tasks.useUpdateTaskStatus();

  const onTaskDrop = (dropZoneId: string, taskId: string, indexInDropZone: number) => {
    setTaskBoardState((prev) => {
      const { todoTasks, inProgressTasks, doneTasks } = prev;

      const task =
        todoTasks.find((t) => t.id === taskId) ||
        inProgressTasks.find((t) => t.id === taskId) ||
        doneTasks.find((t) => t.id === taskId);

      if (!task) return prev;

      let newTodoTasks = todoTasks.filter((t) => t.id !== taskId);
      let newInProgressTasks = inProgressTasks.filter((t) => t.id !== taskId);
      let newDoneTasks = doneTasks.filter((t) => t.id !== taskId);

      task.status = dropZoneId;

      if (dropZoneId === "todo") {
        newTodoTasks = insertAt(newTodoTasks, indexInDropZone, task);
      } else if (dropZoneId === "in_progress") {
        newInProgressTasks = insertAt(newInProgressTasks, indexInDropZone, task);
      } else if (dropZoneId === "done") {
        newDoneTasks = insertAt(newDoneTasks, indexInDropZone, task);
      }

      changeStatus({
        taskId,
        status: dropZoneId,
        columnIndex: indexInDropZone,
      });

      return { todoTasks: newTodoTasks, inProgressTasks: newInProgressTasks, doneTasks: newDoneTasks };
    });
  };

  return (
    <DragAndDropProvider onDrop={onTaskDrop}>
      <div className="grid grid-cols-3 gap-2 items-start">
        <TaskColumn
          title="To Do"
          tasks={taskBoardState.todoTasks}
          color="bg-gray-100"
          onTaskDrop={onTaskDrop}
          status="todo"
        />
        <TaskColumn
          title="In Progress"
          tasks={taskBoardState.inProgressTasks}
          color="bg-gray-100"
          onTaskDrop={onTaskDrop}
          status="in_progress"
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
      props.tasks.forEach((t, i) => (res[t.id!] = i));
    } else {
      props.tasks.filter((t) => t.id !== draggedId).forEach((t, i) => (res[t.id!] = i));
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
          <TaskItem key={task.id} task={task} zoneId={props.status} style={taskStyle(visibleIndexes[task.id!])} />
        ))}

        {props.tasks.length === 0 && <PlaceholderTask />}
      </div>
    </div>
  );
}

function TaskItem({ task, zoneId, style }: { task: Tasks.Task; zoneId: string; style: React.CSSProperties }) {
  const { ref, isDragging } = useDraggable({ id: task.id!, zoneId });

  return (
    <div className="w-full" ref={ref}>
      <div className="my-1" style={isDragging ? {} : style}>
        <DivLink
          className="text-sm bg-surface rounded p-2 border border-stroke-base flex items-start justify-between cursor-pointer"
          to={Paths.taskPath(task.id!)}
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

function orderTasksByKanbanState(tasks: Tasks.Task[], kanbanState: any, status: string): Tasks.Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => {
      const aIndex = kanbanState[status].findIndex((id: string) => compareIds(id, a.id!)) || 0;
      const bIndex = kanbanState[status].findIndex((id: string) => compareIds(id, b.id!)) || 0;

      return aIndex - bIndex;
    });
}
