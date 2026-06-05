defmodule Operately.Features.SpaceKanban.TaskCardsTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
  alias Operately.Support.Time

  setup ctx, do: Steps.setup(ctx)

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
end
