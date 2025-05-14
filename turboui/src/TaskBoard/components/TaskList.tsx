import React, { useMemo } from "react";
import { useDraggingAnimation, useDropZone } from "../../utils/DragAndDrop";
import { TaskItem } from "./TaskItem";
import { TaskBoard } from "./StatusSelector";

// Re-defining TaskWithIndex here to match the one from main TaskBoard
interface TaskWithIndex extends TaskBoard.Task {
  index: number;
}

export interface TaskListProps {
  tasks: TaskBoard.Task[];
  milestoneId: string;
  // The onTaskReorder callback is handled by the DragAndDropProvider in the parent component
}

/**
 * TaskList component with drag and drop functionality
 * Displays a list of tasks for a specific milestone
 * Drag and drop is handled by the DragAndDropProvider in the parent component
 */
export function TaskList({ tasks, milestoneId }: TaskListProps) {
  // Add drag and drop index to each task
  const tasksWithIndex = useMemo(() => {
    return tasks.map((task, index) => ({ ...task, index }));
  }, [tasks]);

  // Set up drop zone for this list of tasks
  const { ref } = useDropZone({
    id: `milestone-${milestoneId}`,
    dependencies: [tasksWithIndex]
  });
  
  // Get the animation styles for the container and items
  const { containerStyle, itemStyle } = useDraggingAnimation(`milestone-${milestoneId}`, tasksWithIndex);

  return (
    <ul ref={ref as React.RefObject<HTMLUListElement>} style={containerStyle}>
      {tasksWithIndex.map((task) => (
        <TaskItem
          key={task.id}
          task={task as TaskWithIndex}
          milestoneId={milestoneId}
          itemStyle={itemStyle}
        />
      ))}
    </ul>
  );
}

export default TaskList;
