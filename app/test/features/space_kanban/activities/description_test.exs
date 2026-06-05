defmodule Operately.Features.SpaceKanban.Activities.DescriptionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SpaceKanbanCase

  feature "changing a task description creates an activity", ctx do
    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(content: "Updated description for the task.")
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
  end

  feature "task-description-changing activity works after task is deleted", ctx do
    status_value = hd(ctx.status_values)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(person: ctx.teammate)
    |> Steps.close_task_slide_in(:task)
    |> Steps.reload_task(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of a task",
      long_title: "updated the description of a task"
    )
    |> Steps.assert_description_change_notification_sent(to: :teammate, task_name: "a task")
  end

  feature "task-description-changing activity task link redirects to space kanban page", ctx do
    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(content: "Updated description for the task.")
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.click_task_link_in_space_feed(task_name: ctx.task.name)
    |> Steps.assert_space_kanban_page_open()
  end
end
