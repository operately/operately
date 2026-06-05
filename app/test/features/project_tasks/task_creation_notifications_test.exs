defmodule Operately.Features.ProjectTasks.TaskCreationNotificationsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :contributor
  feature "creating a task notifies the champion and assignee", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task with notifications",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.assert_task_added_notification_sent(to: ctx.champion, author: ctx.contributor)
    |> Steps.assert_task_added_notification_sent(to: ctx.space_member, author: ctx.contributor)
    |> Steps.assert_task_added_email_sent(to: ctx.champion, author: ctx.contributor)
    |> Steps.assert_task_added_email_sent(to: ctx.space_member, author: ctx.contributor)
  end

  @tag login_as: :contributor
  feature "creating a task does not notify the author", ctx do
    attrs = %{
      name: "Task created by champion",
      assignee: ctx.champion.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.refute_task_added_notification_sent(recipient: ctx.contributor)
  end
end
