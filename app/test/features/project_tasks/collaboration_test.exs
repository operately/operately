defmodule Operately.Features.ProjectTasks.CollaborationTest do
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

  describe "move task" do
    @tag login_as: :contributor
    feature "move to a space from sidebar actions", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_space_exists()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
      |> Steps.visit_task_page()
      |> Steps.move_task_to_destination_space()
      |> Steps.assert_redirected_to_destination_space_kanban()
      |> Steps.assert_task_present()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_not_present()
    end

    @tag login_as: :contributor
    feature "move to another project from sidebar actions", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_project_exists()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
      |> Steps.visit_task_page()
      |> Steps.move_task_to_destination_project()
      |> Steps.assert_redirected_to_destination_project_task()
      |> Steps.assert_task_belongs_to_destination_project()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_not_present()
      |> Steps.visit_destination_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
    end

    @tag login_as: :contributor
    feature "current project not shown as option", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_project_exists()
      |> Steps.visit_task_page()
      |> Steps.open_move_task_modal()
      |> Steps.assert_only_destination_project_shown()
    end
  end
end
