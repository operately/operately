defmodule Operately.Features.SpaceKanban.Activities.AssignmentAndCreationTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "changing a task assignee creates an activity", ctx do
    assignee_name = ctx.teammate.full_name

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_card_assignee(task_key: :task, assignee_name: assignee_name)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "assigned to #{assignee_name} the task #{ctx.task.name}",
      long_title: "assigned to #{assignee_name} the task #{ctx.task.name} in #{ctx.space.name}"
    )
  end

  feature "task-assignee-updating activity works after task is deleted", ctx do
    status_value = hd(ctx.status_values)
    assignee_name = ctx.teammate.full_name

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.reload_task(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "assigned to #{assignee_name} the task a task",
      long_title: "assigned to #{assignee_name} the task a task in #{ctx.space.name}"
    )
  end

  feature "adding a task creates an activity", ctx do
    [primary_status | _] = ctx.status_values
    task_title = "Inline Task Activity"

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_inline_task(status_value: primary_status, title: task_title)
    |> Steps.load_task_by_name(key: :inline_task_activity, name: task_title)
    |> Steps.assert_task_in_status(task_key: :inline_task_activity, status_value: primary_status)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "added the task #{task_title}",
      long_title: "added the task #{task_title} in #{ctx.space.name}"
    )
  end

  feature "task-adding activity works after task is deleted", ctx do
    [primary_status | _] = ctx.status_values
    task_title = "Inline Task Activity"

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_inline_task(status_value: primary_status, title: task_title)
    |> Steps.load_task_by_name(key: :inline_task_activity, name: task_title)
    |> Steps.open_task_slide_in(:inline_task_activity)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :inline_task_activity, status_value: primary_status)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "added the task \"#{task_title}\"",
      long_title: "added the task \"#{task_title}\" in #{ctx.space.name}"
    )
  end
end
