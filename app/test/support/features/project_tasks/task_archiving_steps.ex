defmodule Operately.Support.Features.ProjectTasks.TaskArchivingSteps do
  use Operately.FeatureCase

  step :close_task, ctx do
    status = Enum.find(ctx.project.task_statuses, &(&1.value == "done"))
    {:ok, task} = Operately.Tasks.update_task(ctx.task, Operately.Tasks.Task.status_change_attrs(ctx.task, status))
    Map.put(ctx, :task, task)
  end

  step :archive_task, ctx do
    ctx
    |> UI.click(testid: UI.testid(["kanban-card-title", Paths.task_id(ctx.task)]))
    |> UI.click(testid: "archive-task")
    |> UI.assert_has(testid: "archive-task-confirmation")
    |> UI.take_screenshot()
    |> UI.click(testid: "archive-task-confirmation-confirm")
    |> assert_task_absent()
    |> UI.assert_has(testid: "kanban-column-done")
  end

  step :assert_task_absent, ctx do
    ctx |> UI.refute_has(testid: UI.testid(["kanban-card", Paths.task_id(ctx.task)]))
  end

  step :show_archive, ctx do
    ctx
    |> UI.click(testid: "display-menu-trigger")
    |> UI.assert_has(testid: "tasks")
    |> UI.take_screenshot()
    |> UI.click(testid: "tasks")
    |> UI.assert_has(testid: "archived-tasks-view")
    |> UI.click(testid: "archived-tasks-view")
  end

  step :assert_only_closed_column, ctx do
    ctx
    |> UI.refute_has(testid: "kanban-column-pending")
    |> UI.refute_has(testid: "kanban-column-in-progress")
    |> UI.refute_has(testid: "kanban-column-canceled")
    |> UI.take_screenshot()
  end

  step :restore_task, ctx do
    ctx
    |> UI.click(testid: UI.testid(["kanban-card-title", Paths.task_id(ctx.task)]))
    |> UI.click(testid: "restore-task")
    |> UI.assert_has(testid: "archive-empty-state")
  end
end
