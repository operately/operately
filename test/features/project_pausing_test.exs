defmodule Operately.Features.ProjectPausingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectPausingSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "pausing and resuming a project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> UI.login_as(ctx.reviewer)
    |> Steps.assert_pause_notification_sent_to_reviewer()
    |> Steps.assert_pause_visible_on_project_feed()
    |> Steps.assert_pause_email_sent_to_reviewer()
  end

  @tag login_as: :champion
  feature "resuming a project", ctx do
    Operately.Projects.update_project(ctx.project, %{status: "paused"})

    ctx
    |> ProjectSteps.visit_project_page()
    |> Steps.resume_project()
    |> Steps.assert_project_active()
    |> UI.login_as(ctx.reviewer)
    |> Steps.assert_resume_notification_sent_to_reviewer()
    |> Steps.assert_resume_visible_on_project_feed()
    |> Steps.assert_resume_email_sent_to_reviewer()
  end

end
