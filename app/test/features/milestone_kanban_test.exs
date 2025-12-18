defmodule Operately.Features.MilestoneKanbanTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.MilestoneKanbanSteps, as: Steps
  alias Operately.Support.Time
  alias Operately.Support.Factory

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Kanban Project")

    ctx =
      ctx
      |> Map.put(:creator, ctx.champion)
      |> Factory.add_project_milestone(:milestone, :project, title: "Alpha Milestone")
      |> Factory.add_project_milestone(:another_milestone, :project, title: "Beta Milestone")
      |> Factory.add_project_task(:task, :milestone, name: "First Task")
      |> Factory.add_project_task(:second_task, :milestone, name: "Second Task")
      |> Factory.add_project_contributor(:teammate, :project, :as_person)
      |> ProjectSteps.login()

    status_values = Enum.map(ctx.project.task_statuses, & &1.value)

    {:ok, Map.put(ctx, :status_values, status_values)}
  end

  @tag login_as: :champion
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

  @tag login_as: :champion
  feature "edit an existing status label", ctx do
    [_primary | rest] = ctx.status_values
    secondary_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.edit_status(status_value: secondary_status, new_label: "In Motion", appearance: "blue")
    |> Steps.assert_status_label(status_value: secondary_status, label: "IN MOTION")
  end

  @tag login_as: :champion
  feature "add a task inline in a column", ctx do
    [primary_status | _] = ctx.status_values

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_inline_task(status_value: primary_status, title: "Inline Task")
    |> Steps.load_task_by_name(key: :inline_task, name: "Inline Task")
    |> Steps.assert_task_in_status(task_key: :inline_task, status_value: primary_status)
  end

  @tag login_as: :champion
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

  @tag login_as: :champion
  feature "moving a task to another milestone updates the correct board", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.change_task_milestone(milestone_title: ctx.another_milestone.title)
    |> Steps.close_task_slide_in(:second_task)
    |> Steps.assert_task_absent_in_status(task_key: :second_task, status_value: new_status)
    |> Steps.visit_kanban_page_for(:another_milestone)
    |> Steps.assert_task_in_status(task_key: :second_task, status_value: new_status)
  end

  @tag login_as: :champion
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

  @tag login_as: :champion
  feature "cannot delete the last remaining status", ctx do
    statuses = Steps.single_status("Solo")
    status_params = Enum.map(statuses, &Map.from_struct/1)

    {:ok, project} = Operately.Projects.update_project(ctx.project, %{task_statuses: status_params})

    ctx = Map.put(ctx, :project, project)
    solo_value = hd(statuses).value

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_status_delete_modal(solo_value)
    |> Steps.assert_delete_status_blocked()
  end

  @tag login_as: :champion
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
end
