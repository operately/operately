defmodule Operately.Features.SpaceKanban.ActivitiesTest do
  use Operately.FeatureCase
  use Operately.Support.Features.SpaceKanbanCase

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

  feature "changing a task description creates an activity", ctx do
    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(content: "Updated description for the task.")
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
  end

  feature "task-description-changing activity works after task is deleted", ctx do
    status_value = hd(ctx.status_values)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(person: ctx.teammate)
    |> Steps.close_task_slide_in(:task)
    |> Steps.reload_task(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of a task",
      long_title: "updated the description of a task"
    )
    |> Steps.assert_description_change_notification_sent(to: :teammate, task_name: "a task")
  end

  feature "task-description-changing activity task link redirects to space kanban page", ctx do
    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(content: "Updated description for the task.")
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.click_task_link_in_space_feed(task_name: ctx.task.name)
    |> Steps.assert_space_kanban_page_open()
  end
end
