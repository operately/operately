defmodule Operately.Features.ProjectTasksTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx do
    ctx
    |> ProjectSteps.create_project(name: "Test Project")
    |> Factory.add_project_milestone(:milestone, :project)
    |> ProjectSteps.login()
  end

  @tag login_as: :champion
  feature "create task from milestone page", ctx do
    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
  end

  @tag login_as: :champion
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
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_task_milestone(attrs.milestone)
  end

  @tag login_as: :champion
  feature "create task without assignee", ctx do
    attrs = %{
      name: "My task",
      assignee: nil,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_assignee()
  end

  @tag login_as: :champion
  feature "create task without milestone", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: nil
    }

    ctx
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_milestone()
  end

  @tag login_as: :champion
  feature "create task without due date", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_due_date()
  end

  @tag login_as: :champion
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
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_task_milestone(attrs.milestone)
  end

  @tag login_as: :champion
  feature "add multiple tasks with 'Create more' toggle on", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_multiple_tasks(names: ["1st task", "2nd task"])
    |> Steps.assert_task_added("1st task")
    |> Steps.assert_task_added("2nd task")
  end

  @tag login_as: :champion
  feature "all form fields are cleared after task is added", ctx do
    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.open_task_form_and_fill_out_all_fields(attrs)
    |> Steps.toggle_create_more_switch()
    |> Steps.click_create_task_button()
    |> Steps.assert_form_fields_are_empty()
  end

  @tag login_as: :champion
  feature "edit task name", ctx do
    new_name = "New task name"
    feed_title = "changed the title of this task from \"My task\" to \"#{new_name}\""

    ctx
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.refute_task_name(new_name)
    |> Steps.edit_task_name(new_name)
    |> Steps.assert_task_name(new_name)
    |> Steps.reload_task_page()
    |> Steps.assert_task_name(new_name)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :champion
  feature "edit task description", ctx do
    new_description = "New task description"

    ctx
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.refute_task_description(new_description)
    |> Steps.edit_task_description(new_description)
    |> Steps.assert_task_description(new_description)
    |> Steps.assert_change_in_feed("updated the description")
    |> Steps.reload_task_page()
    |> Steps.assert_task_description(new_description)
    |> Steps.assert_change_in_feed("updated the description")
  end

  @tag login_as: :champion
  feature "edit task assignee", ctx do
    feed_title = "assigned this task to #{Operately.People.Person.short_name(ctx.champion)}"

    ctx
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :champion
  feature "edit task due date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)
    feed_title = "changed the due date of this task from"

    ctx
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.assert_task_due_date_change_visible_in_feed(formatted_date)
  end

  @tag login_as: :reviewer
  feature "edit task due date sends notification to assignee", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_due_date_changed_notification_sent()
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :reviewer
  feature "remove task due date sends notification to assignee", ctx do
    ctx
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.remove_task_due_date()
    |> Steps.assert_no_due_date()
    |> Steps.assert_due_date_removed_notification_sent()
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :champion
  feature "edit task milestone", ctx do
    ctx =
      ctx
      |> Steps.given_task_exists()
      |> Steps.given_another_milestone_exists()

    feed_title = "attached this task to milestone #{ctx.another_milestone.title}"

    ctx
    |> Steps.visit_task_page()
    |> Steps.edit_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :champion
  feature "post comment to task", ctx do
    ctx
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.post_comment("This is a comment")
    |> Steps.assert_comment("This is a comment")
    |> Steps.reload_task_page()
    |> Steps.assert_comment("This is a comment")
  end

  @tag login_as: :champion
  feature "task page activity feed handles deleted milestone gracefully", ctx do
    ctx
    |> Steps.given_task_exists()
    |> Steps.given_task_feed_references_a_deleted_milestone()
    |> Steps.visit_task_page()
    |> Steps.assert_page_loads_without_errors()
  end
end
