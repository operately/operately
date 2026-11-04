defmodule Operately.Features.SpaceKanban.StatusesTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "add, use, and delete a custom status from the kanban", ctx do
    qa_label = "QA Ready"
    qa_value = Steps.status_value_from_label(qa_label)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_status(label: qa_label, appearance: "blue")
    |> Steps.assert_status_column(value: qa_value)
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: qa_label)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_task_in_status(task_key: :task, status_value: qa_value)
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: qa_label, next_status: "Done")
    |> Steps.close_task_slide_in(:task)
    |> Steps.delete_empty_status(value: qa_value)
    |> Steps.visit_kanban_page()
    |> Steps.assert_status_absent(value: qa_value)
  end

  feature "edit an existing status label", ctx do
    [_primary | rest] = ctx.status_values
    secondary_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.edit_status(status_value: secondary_status, new_label: "In Motion", appearance: "blue")
    |> Steps.assert_status_label(status_value: secondary_status, label: "In Motion")
  end

  feature "cannot delete the last remaining status", ctx do
    statuses = Steps.single_status("Solo")
    status_params = Enum.map(statuses, &Map.from_struct/1)

    {:ok, space} = Operately.Groups.update_group(ctx.space, %{task_statuses: status_params})

    ctx = Map.put(ctx, :space, space)
    solo_value = hd(statuses).value

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.request_status_deletion(solo_value)
    |> Steps.assert_delete_status_blocked()
  end

  feature "delete a status with tasks by selecting a replacement", ctx do
    primary_status = Enum.at(ctx.status_values, 1)
    replacement_status = hd(ctx.status_values)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: "In progress")
    |> Steps.close_task_slide_in(:task)
    |> Steps.request_status_deletion(primary_status)
    |> Steps.select_deleted_status_replacement(replacement_value: replacement_status)
    |> UI.click(testid: "delete-status-confirm")
    |> Steps.assert_task_in_status(task_key: :task, status_value: replacement_status)
    |> Steps.assert_status_absent(value: primary_status)
    |> Steps.visit_kanban_page()
    |> Steps.assert_task_in_status(task_key: :task, status_value: replacement_status)
  end
end
