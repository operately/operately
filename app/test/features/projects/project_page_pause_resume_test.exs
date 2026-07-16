defmodule Operately.Features.Projects.ProjectPagePauseResumeTest do
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

  feature "pausing a project", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.assert_pause_notification_sent_to_reviewer()
    |> Steps.assert_pause_visible_on_feed()
    |> Steps.assert_pause_email_sent_to_reviewer()
    |> Steps.assert_pause_email_contains_description("Pausing the project.")
  end

  feature "pausing a project without a description", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.pause_project_without_description()
    |> Steps.assert_project_paused()
    |> Steps.assert_pause_without_description_visible_on_feed()
    |> Steps.assert_pause_notification_sent_to_reviewer()
    |> Steps.assert_pause_email_sent_to_reviewer()
  end

  feature "mentioning a person when pausing a project sends notification and email", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.pause_project_mentioning(ctx.space_member)
    |> Steps.assert_project_paused()
    |> Steps.assert_pause_mention_visible_on_feed(ctx.space_member)
    |> Steps.assert_pause_notification_sent_to_space_member()
    |> Steps.assert_pause_email_sent_to_space_member()
  end
end
