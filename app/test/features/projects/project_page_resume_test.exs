defmodule Operately.Features.Projects.ProjectPageResumeTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps
  alias Operately.Support.Features.ReviewSteps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

  @tag login_as: :contributor

  feature "resuming a project", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.resume_project()
    |> Steps.assert_project_active()
    |> Steps.assert_resume_notification_sent_to_reviewer()
    |> Steps.assert_project_resumed_visible_on_feed()
    |> Steps.assert_resume_email_sent_to_reviewer()
  end

  @tag login_as: :champion
  feature "resuming a paused project clears overdue check-ins", ctx do
    ctx
    |> Steps.given_project_check_in_is_overdue()
    |> ReviewSteps.visit_review_page()
    |> ReviewSteps.assert_the_due_project_is_listed()
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.resume_project()
    |> ReviewSteps.assert_the_checked_in_project_is_no_longer_displayed()
    |> Steps.assert_next_check_in_scheduled_at_is_next_friday()
  end

  @tag login_as: :commenter
  feature "comment on project resumption", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_comment_access()
    |> Steps.visit_project_page()
    |> Steps.given_project_is_paused()
    |> Steps.given_project_is_resumed()
    |> Steps.leave_comment_on_project_resumption()
    |> Steps.assert_comment_on_resumption_visible_on_feed()
    |> Steps.assert_comment_on_resumption_received_in_notifications()
    |> Steps.assert_comment_on_resumption_received_in_email()
  end

  @tag login_as: :commenter
  feature "comment on project pausing", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_comment_access()
    |> Steps.visit_project_page()
    |> Steps.given_project_is_paused()
    |> Steps.leave_comment_on_project_pausing()
    |> Steps.assert_comment_on_pausing_visible_on_feed()
    |> Steps.assert_comment_on_pausing_received_in_notifications()
    |> Steps.assert_comment_on_pausing_received_in_email()
  end
end
