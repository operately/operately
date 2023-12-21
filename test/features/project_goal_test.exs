defmodule Operately.Features.ProjectGoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    Operately.Companies.enable_experimental_feature(ctx.company, "goals")

    ctx = create_goal(ctx, "Improve support first response time")
    ctx = create_goal(ctx, "Increase feedback score to 90%")

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "connect goal to project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "connect-goal")
    |> UI.assert_text("Improve support first response time")
    |> UI.assert_text("Increase feedback score to 90%")
    |> UI.click(testid: "select-goal-improve-support-first-response-time")
    |> UI.assert_text("CONNECTED GOAL")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Improve support first response time")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      to: ctx.reviewer,
      author: ctx.champion,
      action: "connected the #{ctx.project.name} project to the Improve support first response time goal",
    })

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "connected the #{ctx.project.name} project to the Improve support first response time goal",
    })
  end

  #
  # Utility
  #

  defp create_goal(ctx, name) do
    Operately.Goals.create_goal(ctx.champion, %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      name: name,
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      timeframe: "2023-Q4",
      targets: [
        %{
          name: "First response time",
          from: 30,
          to: 15,
          unit: "minutes",
          index: 0
        },
        %{
          name: "Increase feedback score to 90%",
          from: 80,
          to: 90,
          unit: "percent",
          index: 1
        }
      ]
    })

    ctx
  end
end
