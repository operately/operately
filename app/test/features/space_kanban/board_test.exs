defmodule Operately.Features.SpaceKanban.BoardTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SpaceKanbanCase

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

  feature "task description set through external API is visible in the slide-in", ctx do
    description = Operately.Support.RichText.rich_text("Hello world from API", :as_string)

    ctx =
      ctx
      |> Factory.add_api_token(:api_token, :creator, read_only: false)
      |> Steps.create_space_task_through_external_api(name: "External API task")
      |> Steps.update_task_description_through_external_api(description: description)

    ctx
    |> Steps.visit_kanban_page(task_id: ctx.external_api_task_id)
    |> Steps.assert_description(content: "Hello world from API")
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

  feature "delete a status with tasks by selecting a replacement", ctx do
    primary_status = hd(ctx.status_values)
    replacement_status = Enum.at(ctx.status_values, 1)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_status_delete_modal(primary_status)
    |> Steps.select_deleted_status_replacement(replacement_value: replacement_status)
    |> UI.click(testid: "delete-status-confirm")
    |> Steps.assert_task_in_status(task_key: :task, status_value: replacement_status)
    |> Steps.assert_status_absent(value: primary_status)
    |> Steps.visit_kanban_page()
    |> Steps.assert_task_in_status(task_key: :task, status_value: replacement_status)
  end

  describe "move task" do
    feature "move to a project from the slide-in sidebar", ctx do
      source_status = hd(ctx.status_values)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.open_task_slide_in(:task)
      |> Steps.move_task_to_project(project_name: ctx.destination_project.name)
      |> Steps.assert_task_removed(task_key: :task, status_value: source_status)
      |> Steps.visit_destination_project()
      |> Steps.assert_task_present(task_key: :task)
      |> Steps.assert_task_belongs_to_destination_project(task_key: :task, destination_project_key: :destination_project)
    end

    feature "move to another space from the slide-in sidebar", ctx do
      source_status = hd(ctx.status_values)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.open_task_slide_in(:task)
      |> Steps.move_task_to_space(space_name: ctx.destination_space.name)
      |> Steps.assert_task_removed(task_key: :task, status_value: source_status)
      |> Steps.visit_destination_space_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.assert_task_belongs_to_destination_space(task_key: :task, destination_space_key: :destination_space)
    end

    feature "current space not shown as option", ctx do
      source_status = hd(ctx.status_values)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.open_task_slide_in(:task)
      |> Steps.open_move_task_modal()
      |> Steps.assert_only_destination_space_shown()
    end
  end
end
