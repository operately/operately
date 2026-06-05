defmodule Operately.Features.ProjectTasks.CreationTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :contributor
  feature "create task from milestone page", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
    |> Steps.open_task_slide_in("Task 1")
    |> Steps.assert_task_slide_in_open("Task 1")
  end

  @tag login_as: :contributor
  feature "create task from tasks board", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: next_friday,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_task_milestone(attrs.milestone)
  end

  @tag login_as: :contributor
  feature "create task without assignee", ctx do
    attrs = %{
      name: "My task",
      assignee: nil,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_assignee()
  end

  @tag login_as: :contributor
  feature "create task without milestone", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: nil
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_milestone()
  end

  @tag login_as: :contributor
  feature "create task without due date", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_due_date()
  end

  @tag login_as: :contributor
  feature "create task with due date, assignee and milestone", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: next_friday,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_task_milestone(attrs.milestone)
  end

  @tag login_as: :contributor
  feature "creating task automatically subscribes creator", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
    |> then(fn ctx ->
      task = Operately.Tasks.Task.get!(:system, name: "Task 1")
      Map.put(ctx, :task, task)
    end)
    |> Steps.go_to_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: :contributor
  feature "creating task with assignee automatically subscribes assignee", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task with assignee",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> then(fn ctx ->
      task = Operately.Tasks.Task.get!(:system, name: attrs.name)
      Map.put(ctx, :task, task)
    end)
    |> Steps.login_as_space_member()
    |> Steps.go_to_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: :contributor
  feature "creating a task notifies the champion and assignee", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task with notifications",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.assert_task_added_notification_sent(to: ctx.champion, author: ctx.contributor)
    |> Steps.assert_task_added_notification_sent(to: ctx.space_member, author: ctx.contributor)
    |> Steps.assert_task_added_email_sent(to: ctx.champion, author: ctx.contributor)
    |> Steps.assert_task_added_email_sent(to: ctx.space_member, author: ctx.contributor)
  end

  @tag login_as: :contributor
  feature "creating a task does not notify the author", ctx do
    attrs = %{
      name: "Task created by champion",
      assignee: ctx.champion.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.refute_task_added_notification_sent(recipient: ctx.contributor)
  end

  @tag login_as: :contributor
  feature "assigning a space member to a task adds them as a project contributor", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task for space member",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.assert_person_is_not_project_contributor()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.visit_project_page()
    |> Steps.assert_person_is_project_contributor()
  end

  @tag login_as: :contributor
  feature "add multiple tasks with 'Create more' toggle on", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_multiple_tasks(names: ["1st task", "2nd task"])
    |> Steps.assert_task_added("1st task")
    |> Steps.assert_task_added("2nd task")
  end

  @tag login_as: :contributor
  feature "all form fields are cleared after task is added", ctx do
    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.open_task_form_and_fill_out_all_fields(attrs)
    |> Steps.toggle_create_more_switch()
    |> Steps.click_create_task_button()
    |> Steps.assert_form_fields_are_empty()
  end
end
