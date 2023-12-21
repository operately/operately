defmodule Operately.Features.ProjectGoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    ctx = create_goal(ctx, "Improve support first response time")
    ctx = create_goal(ctx, "Increase feedback score to 90%")

    {:ok, ctx}
  end

  feature "connect goal to project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "connect-goal")
    |> UI.assert_text("Improve support first response time")
    |> UI.assert_text("Increase feedback score to 90%")
    |> UI.click(testid: "connect-goal-improve-support-first-response-time")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Improve support first response time")
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
