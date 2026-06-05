defmodule Operately.Features.ProjectTasks.TaskCommentsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

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
end
