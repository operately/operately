import * as Tasks from "@/models/tasks";
import * as React from "react";

import { useIsDarkMode } from "@/contexts/ThemeContext";
import { DragAndDropProvider, useDraggable, useDraggingAnimation, useDropZone } from "@/features/DragAndDrop";
import { compareIds } from "@/routes/paths";
import { insertAt } from "@/utils/array";
import { match } from "ts-pattern";
import { AvatarList, DivLink } from "turboui";

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
        todoTasks.find((t) => compareIds(t.id, taskId)) ||
        inProgressTasks.find((t) => compareIds(t.id, taskId)) ||
        doneTasks.find((t) => compareIds(t.id, taskId));

      if (!task) return prev;

      let newTodoTasks = todoTasks.filter((t) => !compareIds(t.id, taskId));
      let newInProgressTasks = inProgressTasks.filter((t) => !compareIds(t.id, taskId));
      let newDoneTasks = doneTasks.filter((t) => !compareIds(t.id, taskId));

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
  const isDarkMode = useIsDarkMode();
  const columnClassName = "p-2 rounded" + " " + props.color;

  const { ref } = useDropZone({ id: props.status });
  const { itemStyle, containerStyle } = useDraggingAnimation(props.status, props.tasks);

  return (
    <div className={columnClassName}>
      <div className={`text-xs uppercase font-semibold ${isDarkMode && "text-gray-800"}`}>
        {props.title} {props.tasks.length > 0 && <span>({props.tasks.length})</span>}
      </div>

      <div className="flex flex-col mt-2" ref={ref} style={containerStyle}>
        {props.tasks.map((task, idx) => (
          <TaskItem
            key={task.id}
            task={task}
            zoneId={props.status}
            style={itemStyle(task.id!)}
            testId={`${props.status}_${idx}`}
          />
        ))}

        {props.tasks.length === 0 && <PlaceholderTask />}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  zoneId,
  style,
  testId,
}: {
  task: Tasks.Task;
  zoneId: string;
  style: React.CSSProperties;
  testId: string;
}) {
  const { ref, isDragging } = useDraggable({ id: task.id!, zoneId });

  return (
    <div className="w-full" ref={ref}>
      <div className="my-1" style={isDragging ? {} : style} data-test-id={testId}>
        <DivLink
          className="text-sm bg-surface-base rounded p-2 border border-stroke-base flex items-start justify-between cursor-pointer"
          to={DeprecatedPaths.taskPath(task.id!)}
        >
          <div className="font-medium">{task.name}</div>
          <AvatarList people={task.assignees!} size="tiny" stacked maxElements={5} />
        </DivLink>
      </div>
    </div>
  );
}

function PlaceholderTask() {
  const isDarkMode = useIsDarkMode();

  return (
    <div
      className={`text-sm rounded p-2 border-2 flex items-start justify-between border-dashed h-8 ${
        !isDarkMode && "border-stroke-base"
      }`}
    ></div>
  );
}

function orderTasksByKanbanState(tasks: Tasks.Task[], kanbanState: any, status: string): Tasks.Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => {
      const column = match(status)
        .with("todo", () => kanbanState.todo)
        .with("in_progress", () => kanbanState.inProgress)
        .with("done", () => kanbanState.done)
        .otherwise(() => []);

      const aIndex = column.findIndex((id: string) => compareIds(id, a.id!)) || 0;
      const bIndex = column.findIndex((id: string) => compareIds(id, b.id!)) || 0;

      return aIndex - bIndex;
    });
}
