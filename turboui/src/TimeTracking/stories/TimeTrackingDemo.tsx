import React from "react";
import { useLocation, useNavigate } from "react-router";
import { ViewToggle } from "../../ViewToggle";
import { SwitchToggle } from "../../SwitchToggle";
import { GlobalTimeTracker } from "../TimerControls";
import { demoProject, demoTask, demoSpaceTask } from "../mockData";
import { ProjectTimePreview, TaskTimePreview, SpaceTaskTimePreview } from "./ContextPages";
import { useTimeTrackingDemo, type DemoOptions } from "./useTimeTrackingDemo";
import type { TimeDestination } from "../types";

export interface TimeTrackingDemoProps extends DemoOptions {
  initialView: "project" | "task" | "space-task";
}

export function TimeTrackingDemo(props: TimeTrackingDemoProps) {
  const demo = useTimeTrackingDemo(props);
  const location = useLocation();
  const navigate = useNavigate();
  const view = location.pathname.startsWith("/projects/")
    ? "project"
    : location.pathname.startsWith("/spaces/")
      ? "space-task"
      : location.pathname.startsWith("/tasks/")
        ? "task"
        : props.initialView;
  const project = demo.data.destinations.find((destination) => destination.id === demoProject.id) ?? demoProject;
  const selectedTask = view === "space-task" ? demoSpaceTask.id : (location.pathname.split("/")[2] ?? demoTask.id);
  const task = demo.data.destinations.find((destination) => destination.id === selectedTask) ?? demoTask;
  const openDestination = (destination: TimeDestination) => {
    navigate(
      destination.kind === "project"
        ? "/projects/launch?tab=overview"
        : destination.kind === "space-task"
          ? `/spaces/${destination.scopeId}/kanban?taskId=${destination.id}`
          : `/tasks/${destination.id}`,
    );
  };
  const TaskPreview = view === "space-task" ? SpaceTaskTimePreview : TaskTimePreview;
  return (
    <div className="bg-surface-base text-content-base min-h-screen">
      <div className="px-4 py-3 border-b border-stroke-base bg-surface-dimmed flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-content-dimmed">
          <span className="font-semibold">Time tracking preview</span>
          <span className="hidden sm:inline"> · Changes reset when this story reloads.</span>
        </div>
        <ViewToggle
          value={view}
          ariaLabel="Preview page"
          options={[
            { value: "project", label: "Project", onSelect: () => navigate("/projects/launch?tab=overview") },
            { value: "task", label: "Task", onSelect: () => navigate("/tasks/task-design") },
            { value: "space-task", label: "Space tasks", onSelect: () => navigate("/spaces/product/kanban") },
          ]}
        />
      </div>
      {props.scenario === "save-error" && (
        <div className="px-4 py-3 bg-surface-dimmed">
          <SwitchToggle label="Fail next save" value={demo.failSave} setValue={demo.setFailSave} />
        </div>
      )}
      <div className="relative min-h-screen pb-48">
        {view === "project" ? (
          <ProjectTimePreview
            timeTracking={{
              ...demo.data,
              canViewTeam: demo.canViewTeam,
              onOpenDestination: openDestination,
              projectDestination: project,
              entries: demo.data.entries.filter((entry) => entry.destination.scopeId === project.scopeId),
              onEnabledChange: demo.onEnabledChange,
            }}
          />
        ) : (
          <TaskPreview
            key={task.id}
            onClosedChange={(closed) => demo.onTaskClosedChange(task.id, closed)}
            timeTracking={{
              ...demo.data,
              destination: task,
              canViewTeam: demo.canViewTeam,
              isTaskClosed: task.closed,
            }}
          />
        )}
      </div>
      <div className="fixed z-20 bottom-4 right-4 left-4 sm:left-auto sm:w-[440px] max-w-[calc(100%-2rem)]">
        <GlobalTimeTracker data={demo.data} onOpenDestination={openDestination} />
      </div>
    </div>
  );
}
