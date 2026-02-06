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

  describe "activities" do
    feature "deleting a task creates an activity", ctx do
      status_value = hd(ctx.status_values)
      task_name = ctx.task.name

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "deleted task \"#{task_name}\"",
        long_title: "deleted task \"#{task_name}\" in #{ctx.space.name}"
      )
    end

    feature "renaming a task creates an activity", ctx do
      new_name = "Renamed Task"

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.rename_task(name: new_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_renamed(title: new_name, old_title: ctx[:task].name)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "renamed task to #{new_name}",
        long_title: "renamed task to #{new_name} in #{ctx.space.name}"
      )
    end

    feature "task-renaming activity works after task is deleted", ctx do
      status_value = hd(ctx.status_values)
      new_name = "Renamed then Deleted Task"

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.rename_task(name: new_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_task_renamed(title: new_name, old_title: ctx[:task].name)
      |> Steps.reload_task(:task)
      |> Steps.open_task_slide_in(:task)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "renamed task to #{new_name}",
        long_title: "renamed task to #{new_name} in #{ctx.space.name}"
      )
    end

    feature "changing a task status creates an activity", ctx do
      [old_status_value, new_status_value | _] = ctx.status_values

      old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
      new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_task_in_status(task_key: :task, status_value: new_status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "marked #{ctx.task.name} as #{new_status_label}",
        long_title: "marked #{ctx.task.name} as #{new_status_label} in #{ctx.space.name}"
      )
    end

    feature "task-status-updating activity works after task is deleted", ctx do
      [old_status_value, new_status_value | _] = ctx.status_values

      old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
      new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label
      task_display = "the \"#{ctx.task.name}\" task"

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
      |> Steps.close_task_slide_in(:task)
      |> Steps.reload_task(:task)
      |> Steps.open_task_slide_in(:task)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :task, status_value: new_status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "marked #{task_display} as #{new_status_label}",
        long_title: "marked #{task_display} as #{new_status_label} in #{ctx.space.name}"
      )
    end

    feature "task-status-updating activity task link redirects to space kanban page", ctx do
      [old_status_value, new_status_value | _] = ctx.status_values

      old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
      new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_task_in_status(task_key: :task, status_value: new_status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "marked #{ctx.task.name} as #{new_status_label}",
        long_title: "marked #{ctx.task.name} as #{new_status_label} in #{ctx.space.name}"
      )
      |> Steps.click_task_link_in_space_feed(task_name: ctx.task.name)
      |> Steps.assert_space_kanban_page_open()
    end

    feature "changing a task due date creates an activity", ctx do
      due_date = Time.next_friday()
      due_label = Time.format_month_day(due_date)
      due_label_in_feed = Time.format_month_day_maybe_year(due_date)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_due_date(date: due_date)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_card_due_date(task_key: :task, label: due_label)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
        long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
      )
    end

    feature "task-due-date-updating activity works after task is deleted", ctx do
      status_value = hd(ctx.status_values)
      due_date = Time.next_friday()
      due_label_in_feed = Time.format_month_day_maybe_year(due_date)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_due_date(date: due_date)
      |> Steps.close_task_slide_in(:task)
      |> Steps.open_task_slide_in(:task)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
        long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
      )
    end

    feature "changing a task assignee creates an activity", ctx do
      assignee_name = ctx.teammate.full_name

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_assignee(assignee_name: assignee_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_card_assignee(task_key: :task, assignee_name: assignee_name)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "assigned to #{assignee_name} the task #{ctx.task.name}",
        long_title: "assigned to #{assignee_name} the task #{ctx.task.name} in #{ctx.space.name}"
      )
    end

    feature "task-assignee-updating activity works after task is deleted", ctx do
      status_value = hd(ctx.status_values)
      assignee_name = ctx.teammate.full_name

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_assignee(assignee_name: assignee_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.reload_task(:task)
      |> Steps.open_task_slide_in(:task)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "assigned to #{assignee_name} the task a task",
        long_title: "assigned to #{assignee_name} the task a task in #{ctx.space.name}"
      )
    end

    feature "adding a task creates an activity", ctx do
      [primary_status | _] = ctx.status_values
      task_title = "Inline Task Activity"

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.add_inline_task(status_value: primary_status, title: task_title)
      |> Steps.load_task_by_name(key: :inline_task_activity, name: task_title)
      |> Steps.assert_task_in_status(task_key: :inline_task_activity, status_value: primary_status)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "added the task #{task_title}",
        long_title: "added the task #{task_title} in #{ctx.space.name}"
      )
    end

    feature "task-adding activity works after task is deleted", ctx do
      [primary_status | _] = ctx.status_values
      task_title = "Inline Task Activity"

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.add_inline_task(status_value: primary_status, title: task_title)
      |> Steps.load_task_by_name(key: :inline_task_activity, name: task_title)
      |> Steps.open_task_slide_in(:inline_task_activity)
      |> Steps.delete_task()
      |> Steps.assert_task_removed(task_key: :inline_task_activity, status_value: primary_status)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "added the task \"#{task_title}\"",
        long_title: "added the task \"#{task_title}\" in #{ctx.space.name}"
      )
    end
  end

  describe "activity feed, notifications and emails" do
    feature "changing a task assignee sends notification and email to the new assignee", ctx do
      assignee_name = ctx.teammate.full_name

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_assignee(assignee_name: assignee_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_card_assignee(task_key: :task, assignee_name: assignee_name)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "assigned to #{assignee_name} the task #{ctx.task.name}",
        long_title: "assigned to #{assignee_name} the task #{ctx.task.name} in #{ctx.space.name}"
      )
      |> Steps.assert_assignee_change_notification_sent(to: :teammate)
      |> Steps.assert_assignee_change_email_sent(to: :teammate)
    end

    feature "changing a task due date sends notification and email to the assignee", ctx do
      assignee_name = ctx.teammate.full_name
      due_date = Time.next_friday()
      due_label = Time.format_month_day(due_date)
      due_label_in_feed = Time.format_month_day_maybe_year(due_date)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_assignee(assignee_name: assignee_name)
      |> Steps.close_task_slide_in(:task)
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_due_date(date: due_date)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_card_due_date(task_key: :task, label: due_label)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
        long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
      )
      |> Steps.assert_due_date_change_notification_sent(to: :teammate, task_name: ctx.task.name)
      |> Steps.assert_due_date_change_email_sent(to: :teammate, task_name: ctx.task.name)
    end

    feature "commenting on a space task sends notification and email to the assignee", ctx do
      assignee_name = ctx.teammate.full_name
      comment_text = "This is a test comment on the space task."

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.change_task_assignee(assignee_name: assignee_name)
      |> Steps.add_comment_on_task(comment: comment_text)
      |> Steps.close_task_slide_in(:task)
      |> Steps.assert_activity_in_space_and_company_feeds(
        title: "commented on #{ctx.task.name}",
        long_title: "commented on #{ctx.task.name} in the #{ctx.space.name} space"
      )
      |> Steps.assert_comment_notification_sent(to: :teammate, task_name: ctx.task.name)
      |> Steps.assert_comment_email_sent(to: :teammate, task_name: ctx.task.name)
    end
  end
end
