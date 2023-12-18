defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

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
    |> UI.assert_text("This goal was archived on")

    ctx
    |> GoalSteps.visit_goal_list_page()
    |> UI.refute_has(Query.text(ctx.goal.name))

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_archived_sent(author: ctx.champion, goal: ctx.goal)
    |> EmailSteps.assert_goal_archived_sent(author: ctx.champion, goal: ctx.goal, to: ctx.reviewer)
  end
  
end
