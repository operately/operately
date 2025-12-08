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
end
