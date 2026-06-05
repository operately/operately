defmodule Operately.Features.SpaceKanban.Activities.TaskLifecycleTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SpaceKanbanCase

  feature "deleting a task creates an activity", ctx do
    status_value = hd(ctx.status_values)
    task_name = ctx.task.name

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "deleted task \"#{task_name}\"",
      long_title: "deleted task \"#{task_name}\" in #{ctx.space.name}"
    )
  end

  feature "renaming a task creates an activity", ctx do
    new_name = "Renamed Task"

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.rename_task(name: new_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.visit_kanban_page()
    |> Steps.assert_task_renamed(title: new_name, old_title: ctx[:task].name)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "renamed task to #{new_name}",
      long_title: "renamed task to #{new_name} in #{ctx.space.name}"
    )
  end

  feature "task-renaming activity works after task is deleted", ctx do
    status_value = hd(ctx.status_values)
    new_name = "Renamed then Deleted Task"

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.rename_task(name: new_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_task_renamed(title: new_name, old_title: ctx[:task].name)
    |> Steps.reload_task(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "renamed task to #{new_name}",
      long_title: "renamed task to #{new_name} in #{ctx.space.name}"
    )
  end
end
