defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps

  setup ctx do
    ctx = GoalSteps.create_goal(ctx)
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "archive goal", ctx do
    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "archive-goal")
    |> UI.assert_text("Archive this goal?")
    |> UI.click(testid: "confirm-archive-goal")
    |> UI.assert_text("Goal archived on")

    ctx
    |> UI.visit_goal_list()
    |> UI.refute_has(Query.text(ctx.goal.name))

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_archived_sent(author: ctx.champion, project: ctx.project)
    |> EmailSteps.assert_goal_archived_sent(author: ctx.champion, project: ctx.project, to: ctx.reviewer)
  end
  
end
