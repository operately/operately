defmodule Operately.Features.ProjectTemplates.BoardTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "switch to board view and move a template task between columns", ctx do
    ctx
    |> Steps.given_rich_template_exists()
    |> Steps.visit_template_page()
    |> Steps.visit_template_tasks_tab()
    |> Steps.switch_template_tasks_to_board_view()
    |> Steps.assert_template_task_in_kanban_column(task_key: :task, status_value: "pending")
    |> Steps.open_template_kanban_task_slide_in(:task)
    |> Steps.change_template_kanban_task_status(prev_status: "Not started", next_status: "in_progress")
    |> Steps.close_template_kanban_task_slide_in()
    |> Steps.assert_template_task_in_kanban_column(task_key: :task, status_value: "in_progress")
  end
end
