defmodule Operately.Features.ProjectTasks.BoardTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :contributor
  feature "switch to board view and move a task between columns", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.switch_to_board_view()
    |> Steps.assert_task_in_kanban_column(task_key: :task, status_value: "pending")
    |> Steps.open_kanban_task_slide_in(:task)
    |> Steps.change_kanban_task_status(prev_status: "Not started", next_status: "in_progress")
    |> Steps.close_kanban_task_slide_in()
    |> Steps.assert_task_in_kanban_column(task_key: :task, status_value: "in_progress")
  end
end
