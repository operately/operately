defmodule Operately.Features.SpaceKanbanTest do
  use Operately.FeatureCase

  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
  alias Operately.Support.Features.UI
  alias Operately.Support.Factory
  alias Operately.Support.Time

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Kanban Space")
      |> Factory.create_space_task(:task, :space, name: "First Task")
      |> Factory.create_space_task(:second_task, :space, name: "Second Task")
      |> Factory.add_space_member(:teammate, :space, name: "Taylor Teammate")
      |> UI.login_based_on_tag()

    status_values = Enum.map(ctx.space.task_statuses, & &1.value)

    {:ok, Map.put(ctx, :status_values, status_values)}
  end

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
    |> Steps.delete_status(value: qa_value)
    |> Steps.assert_status_absent(value: qa_value)
  end

  feature "edit an existing status label", ctx do
    [_primary | rest] = ctx.status_values
    secondary_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.edit_status(status_value: secondary_status, new_label: "In Motion", appearance: "blue")
    |> Steps.assert_status_label(status_value: secondary_status, label: "IN MOTION")
  end

  feature "add a task inline in a column", ctx do
    [primary_status | _] = ctx.status_values

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_inline_task(status_value: primary_status, title: "Inline Task")
    |> Steps.load_task_by_name(key: :inline_task, name: "Inline Task")
    |> Steps.assert_task_in_status(task_key: :inline_task, status_value: primary_status)
  end

  feature "edit task details in the slide-in and see updates on card and columns", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)
    due_date = Time.next_friday()
    due_label = Time.format_month_day(due_date)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.change_task_assignee(assignee_name: ctx.teammate.full_name)
    |> Steps.change_task_due_date(date: due_date)
    |> Steps.add_task_description(content: "Updated description for kanban flow.")
    |> Steps.close_task_slide_in(:second_task)
    |> Steps.assert_task_in_status(task_key: :second_task, status_value: new_status)
    |> Steps.assert_card_due_date(task_key: :second_task, label: due_label)
    |> Steps.assert_card_assignee(task_key: :second_task, assignee_name: ctx.teammate.full_name)
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.assert_description(content: "Updated description for kanban flow.")
  end

  feature "delete a task from the slide-in", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :second_task, status_value: new_status)
  end

  feature "cannot delete the last remaining status", ctx do
    statuses = Steps.single_status("Solo")
    status_params = Enum.map(statuses, &Map.from_struct/1)

    {:ok, space} = Operately.Groups.update_group(ctx.space, %{task_statuses: status_params})

    ctx = Map.put(ctx, :space, space)
    solo_value = hd(statuses).value

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_status_delete_modal(solo_value)
    |> Steps.assert_delete_status_blocked()
  end

  feature "cannot delete a status that still contains tasks", ctx do
    primary_status = hd(ctx.status_values)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_status_delete_modal(primary_status)
    |> Steps.assert_delete_status_blocked()
  end
end
