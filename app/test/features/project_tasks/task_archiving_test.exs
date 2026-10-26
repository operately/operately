defmodule Operately.Features.ProjectTasks.TaskArchivingTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Tasks
  alias Operately.Support.Features.ProjectTasks.TaskArchivingSteps, as: Steps

  setup ctx, do: Tasks.setup(ctx)

  @tag login_as: :contributor
  feature "archive and restore a closed task across reloads", ctx do
    ctx
    |> Tasks.given_task_exists()
    |> Steps.close_task()
    |> Tasks.visit_project_page()
    |> Tasks.go_to_tasks_tab()
    |> Tasks.switch_to_board_view()
    |> Steps.archive_task()
    |> Tasks.visit_project_page()
    |> Tasks.go_to_tasks_tab()
    |> Steps.assert_task_absent()
    |> Steps.show_archive()
    |> Tasks.assert_task_in_kanban_column(task_key: :task, status_value: "done")
    |> Steps.assert_only_closed_column()
    |> Tasks.open_kanban_task_slide_in(:task)
    |> Tasks.close_kanban_task_slide_in()
    |> Steps.restore_task()
    |> Tasks.visit_project_page()
    |> Tasks.go_to_tasks_tab()
    |> Tasks.assert_task_in_kanban_column(task_key: :task, status_value: "done")
  end
end
