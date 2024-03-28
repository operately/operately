defmodule Operately.Features.ProjectPausingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx = Steps.create_project(ctx, name: "Test Project")
    ctx = Steps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "pausing and resuming a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.assert_pause_notification_sent_to_reviewer()
    |> Steps.assert_pause_visible_on_project_feed()
    |> Steps.assert_pause_email_sent_to_reviewer()
  end

  @tag login_as: :champion
  feature "resuming a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.resume_project()
    |> Steps.assert_project_active()
    |> Steps.assert_resume_notification_sent_to_reviewer()
    |> Steps.assert_resume_visible_on_project_feed()
    |> Steps.assert_resume_email_sent_to_reviewer()
  end

end
