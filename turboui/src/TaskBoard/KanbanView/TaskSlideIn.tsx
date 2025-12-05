import React from "react";
import { SlideIn } from "../../SlideIn";
import { TaskPage, TaskPageContent } from "../../TaskPage";
import { IconX } from "../../icons";

export namespace TaskSlideIn {
  export interface Props extends Partial<TaskPage.Props> {
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    taskId?: string;
  }
}

export function TaskSlideIn(props: TaskSlideIn.Props) {
  const { isOpen, onClose, isLoading, taskId, ...taskProps } = props;

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} width="60%" showHeader={false} testId="task-slide-in">
      <div className="flex flex-col h-full">
        {/* Custom Header with Task Name and Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-outline bg-surface-base sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-content-accent truncate flex-1 mr-4">
            {taskProps.name || "Loading..."}
          </h2>
          <button
            onClick={onClose}
            className="text-content-subtle hover:text-content-base transition-colors p-1 rounded-full hover:bg-surface-highlight flex-shrink-0"
            aria-label="Close"
            data-test-id="task-slide-in-close-button"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <LoadingPlaceholder />
          ) : (
            <div className="p-6 max-w-6xl mx-auto">
              {taskProps.name && <TaskPageContent state={taskProps as TaskPage.State} />}
            </div>
          )}
        </div>
      </div>
    </SlideIn>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse">
      {/* Header Placeholder */}
      <div className="mt-4">
        <div className="h-8 bg-surface-highlight rounded w-3/4 mb-6"></div>
      </div>

      {/* Content Grid */}
      <div className="sm:grid sm:grid-cols-12 mt-6 gap-6">
        {/* Overview Column */}
        <div className="sm:col-span-8 space-y-6">
          {/* Description Placeholder */}
          <div className="space-y-3">
            <div className="h-4 bg-surface-highlight rounded w-1/4"></div>
            <div className="h-4 bg-surface-highlight rounded w-full"></div>
            <div className="h-4 bg-surface-highlight rounded w-5/6"></div>
            <div className="h-4 bg-surface-highlight rounded w-4/6"></div>
          </div>

          {/* Comments Placeholder */}
          <div className="space-y-4 mt-12">
            <div className="h-5 bg-surface-highlight rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-surface-highlight rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-highlight rounded w-1/4"></div>
                  <div className="h-4 bg-surface-highlight rounded w-full"></div>
                  <div className="h-4 bg-surface-highlight rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="sm:col-span-4 space-y-6 hidden sm:block">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-surface-highlight rounded w-1/3"></div>
              <div className="h-8 bg-surface-highlight rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskSlideIn;
