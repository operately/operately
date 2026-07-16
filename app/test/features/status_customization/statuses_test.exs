defmodule Operately.Features.StatusCustomization.StatusesTest do
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
    |> Steps.select_replacement_for_deleted_status(deleted_label: new_status.label, replacement_value: "pending")
    |> Steps.save_status_changes()
    |> Steps.assert_status_absent(label: new_status.label)
  end
end
