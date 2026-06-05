defmodule Operately.Features.ProjectMilestones.CommentsPostingTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)
  setup ctx, do: Steps.setup_milestone(ctx)

  feature "post comment to milestone", ctx do
    comment = "This is a comment"

    ctx
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_milestone_page()
    |> Steps.post_comment(comment)
    |> Steps.assert_comment(comment)
    |> Steps.reload_milestone_page()
    |> Steps.assert_comment(comment)
    |> Steps.assert_comment_visible_in_feed(comment)
    |> Steps.assert_comment_email_sent_to_project_reviewer()
    |> Steps.assert_comment_notification_sent_to_project_reviewer()
  end

  feature "mentioning a teammate in a milestone comment sends alerts", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    person_first_name = Operately.People.Person.first_name(ctx.space_member)

    ctx
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_milestone_page()
    |> Steps.post_comment_with_mention(ctx.space_member)
    |> Steps.assert_comment(person_first_name)
    |> Steps.reload_milestone_page()
    |> Steps.assert_comment(person_first_name)
    |> Steps.assert_comment_visible_in_feed(person_first_name)
    |> Steps.assert_comment_email_sent_to_space_member()
    |> Steps.assert_comment_notification_sent_to_space_member()
  end

  feature "post comment then delete milestone, verify feed and notifications don't break", ctx do
    comment = "This is a comment"

    ctx
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_milestone_page()
    |> Steps.post_comment(comment)
    |> Steps.assert_comment(comment)
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.delete_milestone()
    |> Steps.assert_redirected_to_project_page()
    |> Steps.assert_milestone_deleted()
    |> Steps.assert_comment_visible_in_feed_after_deletion(comment)
    |> Steps.assert_comment_email_sent_to_project_reviewer()
    |> Steps.assert_comment_notification_sent_after_deletion()
  end

  feature "milestone shows comment indicator with count when comments exist", ctx do
    ctx
    |> Steps.log_in_as_viewer()
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_milestone_without_comments_exists()
    |> Steps.given_milestone_with_comments_exists()
    |> Steps.visit_tasks_tab_on_project_page()
    |> Steps.assert_milestone_comment_indicator_not_visible()
    |> Steps.assert_milestone_comment_count(2)
    |> Steps.visit_project_page()
    |> Steps.assert_milestone_comment_indicator_not_visible_on_overview()
    |> Steps.assert_milestone_comment_count_on_overview(2)
  end

  feature "post comment then delete comment, verify feed doesn't break", ctx do
    comment = "This is a comment"

    ctx
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_milestone_page()
    |> Steps.post_comment(comment)
    |> Steps.assert_comment(comment)
    |> Steps.delete_comment_by_content()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_comment_visible_in_feed_after_deletion()
  end
end
