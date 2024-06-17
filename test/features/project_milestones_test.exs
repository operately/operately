defmodule Operately.Features.ProjectMilestonesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectMilestoneSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Live support")
    ctx = UI.login_as(ctx, ctx.champion)

    {:ok, ctx}
  end

  feature "adding first milestones to a project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("No milestones defined yet")
  end

  feature "write a comment on a milestones", ctx do
    ctx
    |> Steps.given_that_a_milestone_exists("Contract Signed")
    |> Steps.visit_milestone_page()
    |> Steps.leave_a_comment("Hello world")
    |> Steps.assert_comment_visible_in_project_feed("Hello world")
    |> Steps.assert_comment_email_sent_to_project_reviewer()
    |> Steps.assert_comment_notification_sent_to_project_reviewer()
  end
end
