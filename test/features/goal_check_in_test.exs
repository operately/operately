defmodule Operately.Features.GoalCheckInTest do
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
      where: ctx.goal.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "submitted a check-in"
    })
  end

  @tag login_as: :champion
  feature "acknowledging a check-in", ctx do
    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "check-in-now")
    |> UI.fill_rich_text("Checking-in on my goal")
    |> UI.click(testid: "submit-check-in")
    |> UI.assert_text("Check-In from")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_check_in_sent(author: ctx.champion)
    |> UI.click(testid: "notification-check-in-submitted")
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.assert_text("Acknowledged by #{ctx.reviewer.full_name}")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "acknowledged your check-in"
    })

    ctx
    |> GoalSteps.visit_page()
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.reviewer)

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_goal_check_acknowledgement_sent(author: ctx.reviewer)
  end

  @tag login_as: :champion
  feature "edit a submitted check-in", ctx do
    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "check-in-now")
    |> UI.fill_rich_text("Checking-in on my goal")
    |> UI.click(testid: "submit-check-in")
    |> UI.assert_text("Check-In from")
    |> UI.assert_text("Checking-in on my goal")

    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-check-in")
    |> UI.fill_rich_text("This is an edited check-in.")
    |> UI.click(testid: "save-changes")
    |> UI.assert_text("Check-In from")
    |> UI.assert_text("This is an edited check-in.")
  end
  
end
