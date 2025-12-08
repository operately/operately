defmodule Operately.Features.StatusCustomizationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.StatusCustomizationSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup_project(ctx)}
  end

  feature "project champion can add a custom status", ctx do
    new_status = %{label: "Ready for QA", color: :green}

    ctx
    |> Steps.visit_project_tasks()
    |> Steps.open_manage_statuses()
    |> Steps.add_custom_status(label: new_status.label, color: new_status.color)
    |> Steps.save_status_changes()
    |> Steps.assert_status_exists(label: new_status.label, color: new_status.color)
  end

  feature "project champion can rename an existing status", ctx do
    ctx
    |> Steps.visit_project_tasks()
    |> Steps.open_manage_statuses()
    |> Steps.rename_status(old_label: "Not started", new_label: "Backlog")
    |> Steps.save_status_changes()
    |> Steps.assert_status_exists(label: "Backlog", color: :gray)
  end

  feature "project champion can remove a custom status", ctx do
    new_status = %{label: "Ready for QA", color: :green}

    ctx
    |> Steps.visit_project_tasks()
    |> Steps.open_manage_statuses()
    |> Steps.add_custom_status(label: new_status.label, color: new_status.color)
    |> Steps.save_status_changes()
    |> Steps.open_manage_statuses()
    |> Steps.remove_last_status()
    |> Steps.save_status_changes()
    |> Steps.assert_status_absent(label: new_status.label)
  end

  feature "custom statuses can be used in tasks", ctx do
    custom_status = %{label: "Ready for QA", color: :blue, value: Steps.status_value("Ready for QA")}

    ctx
    |> Steps.given_task_exists(name: "Review documentation")
    |> Steps.visit_project_tasks()
    |> Steps.open_manage_statuses()
    |> Steps.add_custom_status(label: custom_status.label, color: custom_status.color)
    |> Steps.save_status_changes()
    |> Steps.open_task_from_tasks_board()
    |> Steps.change_task_status_on_task_page(current_label: "Not started", new_value: custom_status.value)
    |> Steps.assert_task_status(label: custom_status.label)
    |> Steps.assert_task_status_color(color: custom_status.color)
  end

  feature "deleted custom statuses persist on existing tasks", ctx do
    custom_status = %{label: "Ready for QA", color: :blue, value: Steps.status_value("Ready for QA")}

    ctx =
      ctx
      |> Steps.given_task_exists(name: "Review documentation")
      |> Steps.visit_project_tasks()
      |> Steps.open_manage_statuses()
      |> Steps.add_custom_status(label: custom_status.label, color: custom_status.color)
      |> Steps.save_status_changes()
      |> Steps.open_task_from_tasks_board()
      |> Steps.change_task_status_on_task_page(current_label: "Not started", new_value: custom_status.value)

    ctx =
      ctx
      |> Steps.visit_project_tasks()
      |> Steps.open_manage_statuses()
      |> Steps.remove_last_status()
      |> Steps.save_status_changes()
      |> Steps.assert_status_absent(label: custom_status.label)

    ctx
    |> Steps.open_task_from_tasks_board()
    |> Steps.assert_task_status(label: custom_status.label)
    |> Steps.assert_task_status_visible(label: custom_status.label)
    |> Steps.open_status_selector_on_task_page(label: custom_status.label)
    |> Steps.assert_status_option_absent(value: custom_status.value)
    |> Steps.close_status_selector()
  end

  feature "unknown status column appears in kanban when status is deleted", ctx do
    task_name = "Refactor Kanban"

    ctx
    |> Steps.given_task_exists(name: task_name)
    |> Steps.visit_project_tasks()
    |> Steps.open_task_from_tasks_board()
    |> Steps.change_task_status_on_task_page(current_label: "Not started", new_value: "in-progress")
    |> Steps.visit_milestone_kanban()
    |> Steps.refute_kanban_column_visible(status: "unknown-status")
    |> Steps.assert_task_in_kanban_column(task: task_name, column: "in-progress")
    |> Steps.visit_project_tasks()
    |> Steps.open_manage_statuses()
    |> Steps.remove_status_at_index(index: 1)
    |> Steps.save_status_changes()
    |> Steps.visit_milestone_kanban()
    |> Steps.assert_kanban_column_visible(status: "unknown-status")
    |> Steps.assert_task_in_kanban_column(task: task_name, column: "unknown-status")
    |> Steps.visit_project_tasks()
    |> Steps.open_task_from_tasks_board()
    |> Steps.change_task_status_on_task_page(current_label: "In progress", new_value: "done")
    |> Steps.visit_milestone_kanban()
    |> Steps.refute_kanban_column_visible(status: "unknown-status")
    |> Steps.assert_task_in_kanban_column(task: task_name, column: "done")
  end
end
