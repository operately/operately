defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  setup ctx do
    ctx = GoalSteps.create_goal(ctx)
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "check-in on a goal", ctx do
    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "check-in-now")
    |> UI.fill_rich_text("Checking-in on my goal")
    |> UI.click(testid: "submit-check-in")
    |> UI.assert_text("Check-In from")

    ctx
    |> GoalSteps.visit_page()
    |> FeedSteps.assert_goal_check_in(author: ctx.champion)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "submitted a check-in for the #{ctx.goal.name} goal"
    })

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_check_in_sent(author: ctx.champion)
    |> UI.click(testid: "notification-check-in-submitted")
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.assert_text("Check-In acknowledged")
  end
  
end
