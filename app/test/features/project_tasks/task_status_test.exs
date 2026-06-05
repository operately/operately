defmodule Operately.Features.ProjectTasks.TaskStatusTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :contributor
  feature "delete task", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.delete_task()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_not_present()
  end

  @tag login_as: :contributor
  feature "complete task from header checkbox", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.complete_task_from_header_checkbox()
    |> Steps.assert_task_marked_completed()
  end

  @tag login_as: :contributor
  feature "header checkbox is hidden when there is no green status", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_project_has_no_completed_status()
    |> Steps.visit_task_page()
    |> Steps.assert_header_checkbox_hidden()
  end

  @tag login_as: :contributor
  feature "change task status from header selector", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_task_status_in_header("Not started")
    |> Steps.change_task_status_from_header_selector("in_progress")
    |> Steps.assert_task_status_in_header("In progress")
    |> Steps.assert_task_status_value("in_progress")
  end
end
