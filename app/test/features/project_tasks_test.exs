defmodule Operately.Features.ProjectTasksTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx do
    ctx
    |> ProjectSteps.create_project(name: "Test Project")
    |> Factory.add_project_milestone(:milestone, :project)
    |> Steps.setup_contributor()
    |> ProjectSteps.login()
  end

  @tag login_as: :contributor
  feature "create task from milestone page", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
  end

  @tag login_as: :reviewer
  feature "task page hides space navigation when space is not accessible", ctx do
    ctx
    |> Steps.given_task_exists()
    |> ProjectSteps.given_company_members_cannot_access_space()
    |> Steps.visit_task_page()
    |> Steps.assert_task_navigation_without_space()
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

  @tag login_as: :contributor
  feature "edit task name", ctx do
    new_name = "New task name"
    feed_title = "changed the title of this task from \"My task\" to \"#{new_name}\""

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.refute_task_name(new_name)
    |> Steps.edit_task_name(new_name)
    |> Steps.assert_task_name(new_name)
    |> Steps.reload_task_page()
    |> Steps.assert_task_name(new_name)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :contributor
  feature "edit task description", ctx do
    new_description = "New task description"

    ctx
    |> Steps.assert_contributor_has_edit_access()
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

  @tag login_as: :contributor
  feature "task shows description indicator when description is added", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_description_indicator_not_visible()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description("This is a task description")
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_description_indicator_visible()
  end

  @tag login_as: :contributor
  feature "mentioning a person in a task description sends notification and email", ctx do
    ctx =
      ctx
      |> Steps.given_task_exists()
      |> Steps.given_space_member_exists()
      |> Steps.assert_space_member_task_description_not_notified()

    ctx
    |> UI.login_as(ctx.contributor)
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_task_description_notification_sent()
    |> Steps.assert_space_member_task_description_email_sent()
  end

  @tag login_as: :contributor
  feature "edit task assignee", ctx do
    feed_title = "assigned this task to #{Operately.People.Person.short_name(ctx.champion)}"

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.assert_task_assignee_change_visible_in_feed()
  end

  @tag login_as: :contributor
  feature "edit task assignee sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee_changed_notification_sent()
    |> Steps.assert_assignee_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "remove task assignee sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.remove_task_assignee()
    |> Steps.assert_assignee_removed_notification_sent()
    |> Steps.assert_assignee_removed_email_sent()
  end

  @tag login_as: :contributor
  feature "edit task due date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)
    formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)
    feed_title = "changed the due date of this task from"

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.assert_task_due_date_change_visible_in_feed(formatted_date_in_feed)
  end

  @tag login_as: :contributor
  feature "edit task due date sends notification to assignee", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_due_date_changed_notification_sent(formatted_date)
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "remove task due date sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.remove_task_due_date()
    |> Steps.assert_no_due_date()
    |> Steps.assert_due_date_removed_notification_sent()
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "edit task milestone", ctx do
    ctx =
      ctx
      |> Steps.assert_contributor_has_edit_access()
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

  @tag login_as: :contributor
  feature "delete task", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.delete_task()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_not_in_list()
  end

  @tag login_as: :contributor
  feature "complete task from header checkbox", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.complete_task_from_header_checkbox()
    |> Steps.assert_task_marked_completed()
  end

  @tag login_as: :contributor
  feature "header checkbox is hidden when there is no green status", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_project_has_no_completed_status()
    |> Steps.visit_task_page()
    |> Steps.assert_header_checkbox_hidden()
  end

  @tag login_as: :contributor
  feature "change task status from header selector", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_task_status_in_header("Not started")
    |> Steps.change_task_status_from_header_selector("in_progress")
    |> Steps.assert_task_status_in_header("In progress")
    |> Steps.assert_task_status_value("in_progress")
  end

  @tag login_as: :commenter
  feature "post comment to task", ctx do
    ctx = Steps.given_task_exists(ctx)

    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_task_page()
    |> Steps.post_comment("This is a comment")
    |> Steps.assert_comment("This is a comment")
    |> Steps.reload_task_page()
    |> Steps.assert_comment("This is a comment")
    |> Steps.assert_task_comment_visible_in_feed(person: ctx.commenter, task_name: ctx.task.name)
  end

  @tag login_as: :commenter
  feature "mentioning a person in a task comment sends notification and email", ctx do
    ctx =
      ctx
      |> Steps.assert_commenter_has_comment_access()
      |> Steps.given_task_exists()
      |> Steps.given_space_member_exists()
      |> Steps.visit_task_page()
      |> Steps.post_comment("This is a comment without mentions")

    ctx
    |> Steps.assert_space_member_not_notified()

    ctx
    |> Steps.login_as_commenter()
    |> Steps.visit_task_page()
    |> Steps.post_comment_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_notified()
    |> Steps.assert_space_member_mentioned_email_sent()
  end

  @tag login_as: :commenter
  feature "post comment to task sends notification to assignee", ctx do
    ctx = Steps.given_task_exists(ctx)

    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.post_comment("This is a comment")
    |> Steps.assert_comment("This is a comment")
    |> Steps.assert_comment_posted_notification_sent(task_name: ctx.task.name)
    |> Steps.assert_comment_posted_email_sent()
  end

  @tag login_as: :commenter
  feature "feed and notifications don't break when comment is posted and task is deleted", ctx do
    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.post_comment("This is a comment")
    |> Steps.assert_comment("This is a comment")
    |> Steps.login_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_task_page()
    |> Steps.delete_task()
    |> Steps.assert_task_comment_visible_in_feed(person: ctx.commenter, task_name: "a task")
    |> Steps.assert_comment_posted_notification_sent(task_name: "a task")
  end

  @tag login_as: :viewer
  feature "task shows comment indicator with count when comments exist", ctx do
    ctx
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_task_without_comments_exists()
    |> Steps.given_task_with_comments_exists()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_comment_indicator_not_visible()
    |> Steps.assert_task_comment_count(2)
  end

  @tag login_as: :commenter
  feature "delete task comment", ctx do
    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.reload_task_page()
    |> Steps.assert_comment_deleted()
  end

  @tag login_as: :champion
  feature "comment edit and delete not visible to other users on task", ctx do
    ctx
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.given_space_member_exists()
    |> Factory.log_in_person(:space_member)
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.assert_comment_edit_delete_not_visible()
  end

  @tag login_as: :viewer
  feature "copy comment link shows success message", ctx do
    ctx
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.copy_comment_link()
    |> Steps.assert_comment_link_copied_message()
  end

  @tag login_as: :commenter
  feature "post comment then delete comment on task, verify feed doesn't break", ctx do
    comment = "This is a comment"

    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.post_comment(comment)
    |> Steps.assert_comment(comment)
    |> Steps.delete_comment_by_content()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_task_comment_visible_in_feed_after_deletion()
  end

  @tag login_as: :viewer
  feature "task page activity feed handles deleted milestone gracefully", ctx do
    ctx
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_feed_references_a_deleted_milestone()
    |> Steps.visit_task_page()
    |> Steps.assert_page_loads_without_errors()
  end

  @tag login_as: ""
  feature "user can subscribe to task", ctx do
    ctx
    |> Steps.given_task_and_company_member_exist()
    |> Steps.visit_task_page()
    |> Steps.assert_unsubscribed_from_task()
    |> Steps.subscribe_to_task()
    |> Steps.assert_subscribed_to_task()
    |> Steps.visit_project_page()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: ""
  feature "user can unsubscribe to task", ctx do
    ctx
    |> Steps.given_task_and_assignee_exist()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
    |> Steps.unsubscribe_from_task()
    |> Steps.assert_unsubscribed_from_task()
    |> Steps.visit_project_page()
    |> Steps.visit_task_page()
    |> Steps.assert_unsubscribed_from_task()
  end
end
